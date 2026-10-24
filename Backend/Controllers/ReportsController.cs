using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pfa1.Api.Data;
using Pfa1.Api.DTOs;
using Pfa1.Api.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Pfa1.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ReportsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Technician,Client")]
    public async Task<IActionResult> GetReports()
    {
        var query = _context.Reports
            .Include(r => r.Intervention)
            .ThenInclude(i => i.Client)
            .Include(r => r.Intervention)
            .ThenInclude(i => i.Technician)
            .Where(r => r.Intervention != null)
            .AsQueryable();

        if (User.IsInRole("Technician"))
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdClaim, out var userId))
            {
                query = query.Where(r => r.Intervention != null && r.Intervention.TechnicianId == userId);
            }
        }
        else if (User.IsInRole("Client"))
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (!string.IsNullOrWhiteSpace(email))
            {
                query = query.Where(r => r.Intervention != null && r.Intervention.Client != null && r.Intervention.Client.Email == email);
            }
        }

        var reportEntities = await query.ToListAsync();
#pragma warning disable CS8602
        var reports = reportEntities.Select(r => new
        {
            r.Id,
            r.Cause,
            r.Solution,
            r.Duration,
            r.Notes,
            r.ReportDate,
            Intervention = new
            {
                r.Intervention!.Id,
                Title = r.Intervention.Title,
                // clientName should be contact person, clientCompany holds company name
                ClientName = r.Intervention.Client != null ? (r.Intervention.Client.ContactPerson ?? r.Intervention.Client.CompanyName) : null,
                ClientCompany = r.Intervention.Client?.CompanyName,
                TechnicianName = r.Intervention.Technician != null ? r.Intervention.Technician.FullName : null
            }
        });
#pragma warning restore CS8602

        return Ok(reports);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Technician,Client")]
    public async Task<IActionResult> GetReportById(int id)
    {
        var query = _context.Reports
            .Include(r => r.Intervention)!
            .ThenInclude(i => i.Client)
            .Include(r => r.Intervention)!
            .ThenInclude(i => i.Equipment)
            .Include(r => r.Intervention)!
            .ThenInclude(i => i.Technician)
            .AsQueryable();

        var report = await query.FirstOrDefaultAsync(r => r.Id == id);
        if (report == null)
        {
            return NotFound();
        }

        if (User.IsInRole("Technician"))
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId) || report.Intervention?.TechnicianId != userId)
            {
                return Forbid();
            }
        }
        else if (User.IsInRole("Client"))
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrWhiteSpace(email) || report.Intervention?.Client?.Email != email)
            {
                return Forbid();
            }
        }

        return Ok(new
        {
            report.Id,
            ReportNumber = $"RPT-{report.Id:D4}",
            report.ReportDate,
            report.Cause,
            report.Diagnostic,
            report.Solution,
            report.PartsReplaced,
            report.TestsPerformed,
            report.Duration,
            report.StartTime,
            report.EndTime,
            report.Notes,
            report.Recommendations,
            Intervention = new
            {
                report.Intervention!.Id,
                report.Intervention.Title,
                report.Intervention.Description,
                report.Intervention.Priority,
                report.Intervention.Status,
                report.Intervention.CreatedAt,
                report.Intervention.ClientId,
                // clientName should be contact person, clientCompany holds company name
                ClientName = report.Intervention.Client?.ContactPerson ?? report.Intervention.Client?.CompanyName,
                ClientCompany = report.Intervention.Client?.CompanyName ?? report.Intervention.Client?.ContactPerson,
                ClientEmail = report.Intervention.Client?.Email,
                ClientPhone = string.IsNullOrWhiteSpace(report.Intervention.Client?.Phone) ? null : report.Intervention.Client!.Phone.Trim(),
                ClientAddress = report.Intervention.Client?.Address,
                report.Intervention.EquipmentId,
                EquipmentName = report.Intervention.Equipment?.Name,
                EquipmentType = report.Intervention.Equipment?.Type,
                EquipmentBrand = report.Intervention.Equipment?.Brand,
                EquipmentModel = report.Intervention.Equipment?.Model,
                EquipmentSerialNumber = report.Intervention.Equipment?.SerialNumber,
                TechnicianName = report.Intervention.Technician?.FullName,
                TechnicianEmail = report.Intervention.Technician?.Email
            }
        });
    }

    [HttpGet("{id}/pdf")]
    [Authorize(Roles = "Admin,Technician,Client")]
    public async Task<IActionResult> DownloadReportPdf(int id)
    {
        var report = await _context.Reports
            .Include(r => r.Intervention)!
            .ThenInclude(i => i.Client)
            .Include(r => r.Intervention)!
            .ThenInclude(i => i.Equipment)
            .Include(r => r.Intervention)!
            .ThenInclude(i => i.Technician)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (report == null)
        {
            return NotFound();
        }

        if (User.IsInRole("Technician"))
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId) || report.Intervention?.TechnicianId != userId)
            {
                return Forbid();
            }
        }
        else if (User.IsInRole("Client"))
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrWhiteSpace(email) || report.Intervention?.Client?.Email != email)
            {
                return Forbid();
            }
        }

        try
        {
            var pdfBytes = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(35);
                    page.DefaultTextStyle(x => x.FontSize(11).FontColor(Colors.Black));

                    page.Header().PaddingBottom(12).Row(header =>
                    {
                        header.RelativeItem().Column(col =>
                        {
                            col.Item().Row(row =>
                            {
                                row.ConstantItem(76).Height(76).AlignCenter().AlignMiddle().Background(Colors.Teal.Darken1).CornerRadius(18).Text("IT").FontSize(28).SemiBold().FontColor(Colors.White);
                                row.RelativeItem().PaddingLeft(12).Column(info =>
                                {
                                    info.Item().Text("IT Intervention Report").FontSize(18).SemiBold().FontColor(Colors.Blue.Darken1);
                                    info.Item().Text("Rapport d'intervention informatique").FontSize(10).FontColor(Colors.Grey.Medium);
                                });
                            });
                        });

                        header.ConstantItem(250).Height(76).AlignRight().Column(meta =>
                        {
                            meta.Item().Text($"Rapport N° : RPT-{report.Id:D4}").FontSize(10).SemiBold().FontColor(Colors.Grey.Darken1);
                            meta.Item().Text($"Date : {report.ReportDate:dd/MM/yyyy}").FontSize(10).FontColor(Colors.Grey.Darken1);
                            meta.Item().Text($"Statut : {report.Intervention?.Status ?? "N/A"}").FontSize(10).FontColor(Colors.Grey.Darken1);
                        });
                    });

                    page.Content().Column(column =>
                    {
                        column.Item().Container().Padding(18).Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten4).CornerRadius(18).Column(summary =>
                        {
                            summary.Item().Text("Résumé du rapport").FontSize(12).SemiBold().FontColor(Colors.Teal.Darken1);
                            summary.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                            summary.Item().PaddingTop(10).Row(row =>
                            {
                                row.Spacing(10);
                                row.RelativeItem().Text($"Rapport N° : RPT-{report.Id:D4}").FontSize(10).FontColor(Colors.Grey.Darken1);
                                row.RelativeItem().Text($"Date : {report.ReportDate:dd/MM/yyyy}").FontSize(10).FontColor(Colors.Grey.Darken1);
                                row.RelativeItem().Text($"Statut : {report.Intervention?.Status ?? "N/A"}").FontSize(10).FontColor(Colors.Grey.Darken1);
                            });
                        });

                        column.Item().PaddingTop(18).Row(row =>
                        {
                            row.RelativeItem().Background(Colors.White).Border(1).BorderColor(Colors.Grey.Lighten2).CornerRadius(18).Column(card =>
                            {
                                card.Item().Padding(16).Background(Colors.Teal.Lighten4).Text("Client").FontSize(12).SemiBold().FontColor(Colors.Teal.Darken1);
                                card.Item().Padding(16).Column(body =>
                                {
                                    body.Item().Text("Nom").FontSize(9).FontColor(Colors.Grey.Darken1);
                                    body.Item().Text(report.Intervention?.Client?.ContactPerson ?? report.Intervention?.Client?.CompanyName ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                    body.Item().PaddingTop(10).Text("Société").FontSize(9).FontColor(Colors.Grey.Darken1);
                                    body.Item().Text(report.Intervention?.Client?.CompanyName ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                    body.Item().PaddingTop(10).Text("Email").FontSize(9).FontColor(Colors.Grey.Darken1);
                                    body.Item().Text(report.Intervention?.Client?.Email ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                    body.Item().PaddingTop(10).Text("Téléphone").FontSize(9).FontColor(Colors.Grey.Darken1);
                                    body.Item().Text(string.IsNullOrWhiteSpace(report.Intervention?.Client?.Phone) ? "N/A" : report.Intervention!.Client!.Phone.Trim()).FontSize(10).SemiBold().FontColor(Colors.Black);
                                    body.Item().PaddingTop(10).Text("Adresse").FontSize(9).FontColor(Colors.Grey.Darken1);
                                    body.Item().Text(report.Intervention?.Client?.Address ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                });
                            });

                            row.ConstantItem(16);

                            row.RelativeItem().Background(Colors.White).Border(1).BorderColor(Colors.Grey.Lighten2).CornerRadius(18).Column(card =>
                            {
                                card.Item().Padding(16).Background(Colors.Teal.Lighten4).Text("Technicien").FontSize(12).SemiBold().FontColor(Colors.Teal.Darken1);
                                card.Item().Padding(16).Column(body =>
                                {
                                    body.Item().Text("Nom").FontSize(9).FontColor(Colors.Grey.Darken1);
                                    body.Item().Text(report.Intervention?.Technician?.FullName ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                    body.Item().PaddingTop(10).Text("Email").FontSize(9).FontColor(Colors.Grey.Darken1);
                                    body.Item().Text(report.Intervention?.Technician?.Email ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                    body.Item().PaddingTop(10).Text("Téléphone").FontSize(9).FontColor(Colors.Grey.Darken1);
                                    body.Item().Text("N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                });
                            });

                            row.ConstantItem(16);

                            row.RelativeItem().Background(Colors.White).Border(1).BorderColor(Colors.Grey.Lighten2).CornerRadius(18).Column(card =>
                            {
                                card.Item().Padding(16).Background(Colors.Teal.Lighten4).Text("Équipement").FontSize(12).SemiBold().FontColor(Colors.Teal.Darken1);
                                card.Item().Padding(16).Column(body =>
                                {
                                    body.Item().Text("Nom").FontSize(9).FontColor(Colors.Grey.Darken1);
                                    body.Item().Text(report.Intervention?.Equipment?.Name ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                    body.Item().PaddingTop(10).Text("Type").FontSize(9).FontColor(Colors.Grey.Darken1);
                                    body.Item().Text(report.Intervention?.Equipment?.Type ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                    body.Item().PaddingTop(10).Text("Marque").FontSize(9).FontColor(Colors.Grey.Darken1);
                                    body.Item().Text(report.Intervention?.Equipment?.Brand ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                    body.Item().PaddingTop(10).Text("Modèle").FontSize(9).FontColor(Colors.Grey.Darken1);
                                    body.Item().Text(report.Intervention?.Equipment?.Model ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                    body.Item().PaddingTop(10).Text("Numéro de série").FontSize(9).FontColor(Colors.Grey.Darken1);
                                    body.Item().Text(report.Intervention?.Equipment?.SerialNumber ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                });
                            });
                        });

                        column.Item().PaddingTop(18).Container().Background(Colors.White).Border(1).BorderColor(Colors.Grey.Lighten2).CornerRadius(18).Column(card =>
                        {
                            card.Item().Padding(16).Background(Colors.Teal.Lighten4).Text("Intervention").FontSize(12).SemiBold().FontColor(Colors.Teal.Darken1);
                            card.Item().Padding(16).Column(body =>
                            {
                                body.Item().Text("Titre").FontSize(9).FontColor(Colors.Grey.Darken1);
                                body.Item().PaddingBottom(10).Text(report.Intervention?.Title ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                body.Item().Text("Description").FontSize(9).FontColor(Colors.Grey.Darken1);
                                body.Item().PaddingBottom(10).Text(report.Intervention?.Description ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                body.Item().Row(row =>
                                {
                                    row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).CornerRadius(12).Padding(10).Column(b =>
                                    {
                                        b.Item().Text("Priorité").FontSize(9).FontColor(Colors.Grey.Darken1);
                                        b.Item().Text(report.Intervention?.Priority ?? "N/A").FontSize(10).SemiBold().FontColor(GetPriorityColor(report.Intervention?.Priority));
                                    });
                                    row.ConstantItem(16);
                                    row.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).CornerRadius(12).Padding(10).Column(b =>
                                    {
                                        b.Item().Text("Statut").FontSize(9).FontColor(Colors.Grey.Darken1);
                                        b.Item().Text(report.Intervention?.Status ?? "N/A").FontSize(10).SemiBold().FontColor(GetStatusColor(report.Intervention?.Status));
                                    });
                                });
                                body.Item().PaddingTop(10).Text("Date de création").FontSize(9).FontColor(Colors.Grey.Darken1);
                                body.Item().PaddingBottom(10).Text(report.Intervention?.CreatedAt.ToString("dd/MM/yyyy") ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                body.Item().Text("Date de début").FontSize(9).FontColor(Colors.Grey.Darken1);
                                body.Item().PaddingBottom(10).Text(FormatDateString(report.StartTime)).FontSize(10).SemiBold().FontColor(Colors.Black);
                                body.Item().Text("Date de fin").FontSize(9).FontColor(Colors.Grey.Darken1);
                                body.Item().Text(FormatDateString(report.EndTime)).FontSize(10).SemiBold().FontColor(Colors.Black);
                            });
                        });

                        column.Item().PaddingTop(18).Container().Background(Colors.White).Border(1).BorderColor(Colors.Grey.Lighten2).CornerRadius(18).Column(card =>
                        {
                            card.Item().Padding(16).Background(Colors.Teal.Lighten4).Text("Rapport technique").FontSize(12).SemiBold().FontColor(Colors.Teal.Darken1);
                            card.Item().Padding(16).CornerRadius(18).Column(body =>
                            {
                                body.Item().Text("Cause du problème").FontSize(9).FontColor(Colors.Grey.Darken1);
                                body.Item().PaddingBottom(10).Text(report.Cause ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                body.Item().Text("Diagnostic").FontSize(9).FontColor(Colors.Grey.Darken1);
                                body.Item().PaddingBottom(10).Text(report.Diagnostic ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                body.Item().Text("Solution appliquée").FontSize(9).FontColor(Colors.Grey.Darken1);
                                body.Item().PaddingBottom(10).Text(report.Solution ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                body.Item().Text("Pièces remplacées").FontSize(9).FontColor(Colors.Grey.Darken1);
                                body.Item().PaddingBottom(10).Text(report.PartsReplaced ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                body.Item().Text("Tests effectués").FontSize(9).FontColor(Colors.Grey.Darken1);
                                body.Item().PaddingBottom(10).Text(report.TestsPerformed ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                body.Item().Text("Durée").FontSize(9).FontColor(Colors.Grey.Darken1);
                                body.Item().PaddingBottom(10).Text(report.Duration ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                body.Item().Text("Remarques").FontSize(9).FontColor(Colors.Grey.Darken1);
                                body.Item().PaddingBottom(10).Text(report.Notes ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                                body.Item().Text("Recommandations").FontSize(9).FontColor(Colors.Grey.Darken1);
                                body.Item().Text(report.Recommendations ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Black);
                            });
                        });

                        column.Item().PaddingTop(20).Container().Background(Colors.White).Border(1).BorderColor(Colors.Grey.Lighten2).CornerRadius(18).Padding(18).Column(sig =>
                        {
                            sig.Item().Text("Technicien").FontSize(10).SemiBold().FontColor(Colors.Blue.Darken1);
                            sig.Item().PaddingTop(12).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                            sig.Item().PaddingTop(8).Text(report.Intervention?.Technician?.FullName ?? "N/A").FontSize(10).SemiBold().FontColor(Colors.Blue.Darken1);
                        });
                    });
                });
            }).GeneratePdf();

            return File(pdfBytes, "application/pdf", $"report-{report.Id}.pdf");
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "PDF generation failed. Configure QuestPDF license (QuestPDF.Settings.License = LicenseType.Evaluation) in Program.cs or check library configuration.", detail = ex.Message });
        }
    }

    private static Color GetPriorityColor(string? priority)
    {
        if (string.IsNullOrWhiteSpace(priority))
            return Colors.Grey.Darken1;

        return priority.Trim().ToLowerInvariant() switch
        {
            "haute" => Colors.Red.Darken1,
            "high" => Colors.Red.Darken1,
            "moyenne" => Colors.Orange.Darken1,
            "medium" => Colors.Orange.Darken1,
            "faible" => Colors.Green.Darken1,
            "low" => Colors.Green.Darken1,
            _ => Colors.Grey.Darken1,
        };
    }

    private static Color GetStatusColor(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return Colors.Grey.Darken1;

        return status.Trim().ToLowerInvariant() switch
        {
            "terminée" => Colors.Green.Darken1,
            "completed" => Colors.Green.Darken1,
            "en cours" => Colors.Blue.Darken1,
            "in progress" => Colors.Blue.Darken1,
            "en attente" => Colors.Grey.Darken1,
            "pending" => Colors.Grey.Darken1,
            _ => Colors.Grey.Darken1,
        };
    }

    private static string FormatDateString(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "N/A";
        }

        if (DateTime.TryParse(value, out var parsedDate))
        {
            return parsedDate.ToString("dd/MM/yyyy");
        }

        return value;
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Technician")]
    public async Task<IActionResult> DeleteReport(int id)
    {
        var report = await _context.Reports
            .Include(r => r.Intervention)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (report == null)
        {
            return NotFound(new { message = "Rapport introuvable." });
        }

        if (User.IsInRole("Technician"))
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId) || report.Intervention?.TechnicianId != userId)
            {
                return Forbid();
            }
        }

        if (report.Intervention != null)
        {
            report.Intervention.Status = "Completed";
        }

        _context.Reports.Remove(report);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Rapport supprimé." });
    }

    [HttpPost("intervention/{interventionId}")]
    [Authorize(Roles = "Admin,Technician")]
    public async Task<IActionResult> CreateReport(int interventionId, ReportDto request)
    {
        var intervention = await _context.Interventions.FindAsync(interventionId);
        if (intervention == null) return NotFound(new { message = "Intervention introuvable." });

        if (User.IsInRole("Technician"))
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId) || intervention.TechnicianId != userId)
            {
                return Forbid();
            }
        }

        if (await _context.Reports.AnyAsync(r => r.InterventionId == interventionId))
        {
            return BadRequest(new { message = "Un rapport existe déjà pour cette intervention." });
        }

        var report = new Report
        {
            InterventionId = interventionId,
            Cause = request.Cause,
            Diagnostic = request.Diagnostic,
            Solution = request.Solution,
            PartsReplaced = request.PartsReplaced,
            TestsPerformed = request.TestsPerformed,
            Duration = request.Duration,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Notes = request.Notes,
            Recommendations = request.Recommendations
        };

        intervention.Status = "Completed";
        _context.Reports.Add(report);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetReportById), new { id = report.Id }, new { id = report.Id });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Technician")]
    public async Task<IActionResult> CreateReport(CreateReportDto request)
    {
        var intervention = await _context.Interventions.FindAsync(request.InterventionId);
        if (intervention == null) return NotFound(new { message = "Intervention introuvable." });

        if (User.IsInRole("Technician"))
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId) || intervention.TechnicianId != userId)
            {
                return Forbid();
            }
        }

        if (await _context.Reports.AnyAsync(r => r.InterventionId == request.InterventionId))
        {
            return BadRequest(new { message = "Un rapport existe déjà pour cette intervention." });
        }

        var report = new Report
        {
            InterventionId = request.InterventionId,
            Cause = request.Cause,
            Diagnostic = request.Diagnostic,
            Solution = request.Solution,
            PartsReplaced = request.PartsReplaced,
            TestsPerformed = request.TestsPerformed,
            Duration = request.Duration,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Notes = request.Notes,
            Recommendations = request.Recommendations
        };

        intervention.Status = "Completed";
        _context.Reports.Add(report);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetReportById), new { id = report.Id }, new { id = report.Id });
    }
}
