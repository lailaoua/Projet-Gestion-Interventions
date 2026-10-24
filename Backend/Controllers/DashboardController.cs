using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pfa1.Api.Data;
using System.Globalization;
using System.Linq;

namespace Pfa1.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DashboardController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var clientsCount = await _context.Clients.CountAsync();
        var equipmentsCount = await _context.Equipments.CountAsync();
        var techniciansCount = await _context.Users.CountAsync(u => u.Role == "Technician");
        var interventions = await _context.Interventions.AsNoTracking().ToListAsync();
        var interventionsCount = interventions.Count;
        var pendingCount = interventions.Where(i => IsPendingStatus(i.Status)).Count();
        var assignedCount = interventions.Where(i => IsAssignedStatus(i.Status)).Count();
        var inProgressCount = interventions.Where(i => IsInProgressStatus(i.Status)).Count();
        var completedCount = interventions.Where(i => IsCompletedStatus(i.Status)).Count();
        var urgentCount = interventions.Where(i => i.Priority == "Urgent" && !IsCompletedStatus(i.Status)).Count();
        var reportsCreatedCount = await _context.Reports.CountAsync();

        var recentInterventions = await _context.Interventions
            .Include(i => i.Client)
            .OrderByDescending(i => i.CreatedAt)
            .Take(5)
            .Select(i => new
            {
                i.Id,
                i.Title,
                i.Status,
                CreatedAt = i.CreatedAt,
                ClientName = i.Client != null ? i.Client.CompanyName : "Client non renseigné"
            })
            .ToListAsync();

        var recentClients = await _context.Clients
            .OrderByDescending(c => c.CreatedAt)
            .Take(5)
            .Select(c => new
            {
                c.Id,
                c.CompanyName,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        var availableEquipments = await _context.Equipments
            .Where(e => e.ClientId == null)
            .OrderByDescending(e => e.CreatedAt)
            .Take(3)
            .Select(e => new
            {
                e.Id,
                e.Name,
                e.Type,
                e.Brand,
                e.Model,
                e.SerialNumber,
                e.PhotoUrl,
                CreatedAt = e.CreatedAt,
                Status = "Available"
            })
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        return Ok(new
        {
            clients = clientsCount,
            equipments = equipmentsCount,
            technicians = techniciansCount,
            interventions = interventionsCount,
            reportsCreated = reportsCreatedCount,
            pending = pendingCount,
            assigned = assignedCount,
            inProgress = inProgressCount,
            completed = completedCount,
            urgent = urgentCount,
            recentInterventions,
            recentClients,
            availableEquipments
        });
    }

    [HttpGet("technician-analytics")]
    public async Task<IActionResult> GetTechnicianAnalytics([FromQuery] string filter = "year")
    {
        var now = DateTime.UtcNow;
        var (start, end) = filter.ToLowerInvariant() switch
        {
            "today" => (now.Date, now.Date.AddDays(1).AddTicks(-1)),
            "week" => (now.Date.AddDays(-(int)now.DayOfWeek + 1), now.Date.AddDays(1).AddTicks(-1)),
            "month" => (new DateTime(now.Year, now.Month, 1), new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month)).AddDays(1).AddTicks(-1)),
            "year" => (new DateTime(now.Year, 1, 1), new DateTime(now.Year, 12, 31).AddDays(1).AddTicks(-1)),
            _ => (new DateTime(now.Year, 1, 1), new DateTime(now.Year, 12, 31).AddDays(1).AddTicks(-1))
        };

        var technicians = await _context.Users
            .Where(u => u.Role == "Technician")
            .Select(u => new { u.Id, u.FullName, u.Email })
            .ToListAsync();

        var interventions = await _context.Interventions
            .Include(i => i.Report)
            .Where(i => i.TechnicianId != null && i.CreatedAt >= start && i.CreatedAt <= end)
            .ToListAsync();

        var technicianStats = technicians.Select(t =>
        {
            var techInterventions = interventions.Where(i => i.TechnicianId == t.Id).ToList();
            var completed = techInterventions.Count(i => IsCompletedStatus(i.Status));
            var inProgress = techInterventions.Count(i => IsInProgressStatus(i.Status));
            var pending = techInterventions.Count(i => IsPendingStatus(i.Status));
            var total = techInterventions.Count;
            var lastIntervention = techInterventions.OrderByDescending(i => i.CreatedAt).FirstOrDefault()?.CreatedAt;
            var resolutionTimes = techInterventions
                .Where(i => i.Report != null && !string.IsNullOrWhiteSpace(i.Report.StartTime) && !string.IsNullOrWhiteSpace(i.Report.EndTime))
                .Select(i => GetResolutionMinutes(i.Report.StartTime!, i.Report.EndTime!))
                .Where(minutes => minutes.HasValue)
                .Select(minutes => minutes!.Value)
                .ToList();
            var averageResolution = resolutionTimes.Any() ? resolutionTimes.Average() : (double?)null;

            return new
            {
                id = t.Id,
                name = t.FullName,
                totalInterventions = total,
                completedInterventions = completed,
                inProgressInterventions = inProgress,
                pendingInterventions = pending,
                averageResolutionMinutes = averageResolution,
                lastInterventionDate = lastIntervention
            };
        }).ToList();

        var barLabels = technicianStats.Select(t => t.name).ToArray();
        var barValues = technicianStats.Select(t => t.completedInterventions).ToArray();

        var pieValues = new[]
        {
            interventions.Count(i => IsPendingStatus(i.Status)),
            interventions.Count(i => IsInProgressStatus(i.Status)),
            interventions.Count(i => IsCompletedStatus(i.Status))
        };

        var lineLabels = filter.ToLowerInvariant() switch
        {
            "today" => Enumerable.Range(0, 24).Select(h => h.ToString("D2") + "h").ToArray(),
            "week" => Enumerable.Range(0, 7).Select(d => start.AddDays(d).ToString("ddd", System.Globalization.CultureInfo.GetCultureInfo("fr-FR"))).ToArray(),
            "month" => Enumerable.Range(1, DateTime.DaysInMonth(now.Year, now.Month)).Select(d => d.ToString()).ToArray(),
            _ => Enumerable.Range(1, 12).Select(m => new DateTime(now.Year, m, 1).ToString("MMM", System.Globalization.CultureInfo.GetCultureInfo("fr-FR"))).ToArray()
        };

        var lineValues = lineLabels.Select(label => filter.ToLowerInvariant() switch
        {
            "today" => interventions.Count(i => i.CreatedAt.Hour == int.Parse(label.Substring(0, 2)) && i.CreatedAt.Date == start.Date),
            "week" => interventions.Count(i => i.CreatedAt.Date == start.AddDays(Array.IndexOf(lineLabels, label)).Date),
            "month" => interventions.Count(i => i.CreatedAt.Date == start.AddDays(int.Parse(label) - 1).Date),
            _ => interventions.Count(i => i.CreatedAt.Month == Array.IndexOf(lineLabels, label) + 1 && i.CreatedAt.Year == now.Year)
        }).ToArray();

        var ranking = technicianStats
            .OrderByDescending(t => t.completedInterventions)
            .ThenBy(t => t.averageResolutionMinutes ?? double.MaxValue)
            .Take(3)
            .Select((t, idx) => new
            {
                rank = idx + 1,
                t.name,
                t.completedInterventions,
                averageResolutionMinutes = t.averageResolutionMinutes
            })
            .ToList();

        return Ok(new
        {
            totalTechnicians = technicians.Count,
            completedInterventions = interventions.Count(i => IsCompletedStatus(i.Status)),
            inProgressInterventions = interventions.Count(i => IsInProgressStatus(i.Status)),
            pendingInterventions = interventions.Count(i => IsPendingStatus(i.Status)),
            reportsCreated = await _context.Reports.CountAsync(r => r.ReportDate >= start && r.ReportDate <= end),
            technicianStats,
            barChart = new
            {
                labels = barLabels,
                values = barValues
            },
            pieChart = new
            {
                labels = new[] { "En attente", "En cours", "Terminées" },
                values = pieValues
            },
            lineChart = new
            {
                labels = lineLabels,
                values = lineValues
            },
            ranking
        });
    }

    [HttpGet("technician-analytics-v2")]
    public Task<IActionResult> GetTechnicianAnalyticsV2([FromQuery] string filter = "year")
    {
        // Forward to the original implementation to ensure identical behaviour.
        return GetTechnicianAnalytics(filter);
    }

    private static double? GetResolutionMinutes(string startTime, string endTime)
    {
        if (TimeSpan.TryParse(startTime, out var start) && TimeSpan.TryParse(endTime, out var end))
        {
            var duration = end - start;
            if (duration < TimeSpan.Zero)
            {
                duration += TimeSpan.FromDays(1);
            }
            return duration.TotalMinutes;
        }
        return null;
    }

    private static bool IsPendingStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return false;
        var normalized = status.Trim().ToLowerInvariant();
        return normalized is "pending" or "en attente" or "a faire" or "à faire";
    }

    private static bool IsAssignedStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return false;
        var normalized = status.Trim().ToLowerInvariant();
        return normalized is "assigned" or "assignée" or "assigné" or "affectée" or "affecté";
    }

    private static bool IsInProgressStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return false;
        var normalized = status.Trim().ToLowerInvariant();
        return normalized is "in progress" or "inprogress" or "en cours";
    }

    private static bool IsCompletedStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return false;
        var normalized = status.Trim().ToLowerInvariant();
        return normalized is "completed" or "terminée" or "terminé" or "terminées";
    }

    private static string NormalizeTechnicianKey(string? fullName, string? email)
    {
        var key = !string.IsNullOrWhiteSpace(email)
            ? email.Trim().ToLowerInvariant()
            : !string.IsNullOrWhiteSpace(fullName)
                ? fullName.Trim().ToLowerInvariant()
                : string.Empty;
        return key;
    }
}
