using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pfa1.Api.Data;
using Pfa1.Api.DTOs;
using Pfa1.Api.Models;

namespace Pfa1.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InterventionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public InterventionsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Technician,Client")]
    public async Task<IActionResult> GetInterventions(string? search, string? status, string? priority, int? technicianId, int? clientId)
    {
        var query = _context.Interventions
            .Include(i => i.Client)
            .Include(i => i.Equipment)
            .Include(i => i.Technician)
            .Include(i => i.Report)
            .AsQueryable();

        if (User.IsInRole("Technician"))
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdClaim, out var userId))
            {
                query = query.Where(i => i.TechnicianId == userId || i.TechnicianId == null);
            }
        }
        else if (User.IsInRole("Client"))
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (!string.IsNullOrWhiteSpace(email))
            {
                var client = await _context.Clients.FirstOrDefaultAsync(c => c.Email == email);
                if (client != null)
                {
                    query = query.Where(i => i.ClientId == client.Id);
                }
                else
                {
                    return Ok(Array.Empty<object>());
                }
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(i => i.Title.Contains(term) || i.Description != null && i.Description.Contains(term) || i.Client != null && i.Client.CompanyName.Contains(term) || i.Equipment != null && i.Equipment.Name.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(i => i.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(priority))
        {
            query = query.Where(i => i.Priority == priority);
        }

        if (technicianId.HasValue)
        {
            query = query.Where(i => i.TechnicianId == technicianId.Value);
        }

        if (clientId.HasValue)
        {
            query = query.Where(i => i.ClientId == clientId.Value);
        }

        var interventions = await query
            .Select(i => new
            {
                i.Id,
                i.Title,
                i.Description,
                i.Priority,
                i.Status,
                i.CreatedAt,
                i.ClientId,
                ClientName = i.Client!.CompanyName,
                i.EquipmentId,
                EquipmentName = i.Equipment!.Name,
                i.TechnicianId,
                TechnicianName = i.Technician != null ? i.Technician.FullName : null
            })
            .ToListAsync();

        return Ok(interventions);
    }

    [HttpGet("unassigned")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUnassignedInterventions()
    {
        var interventions = await _context.Interventions
            .Include(i => i.Client)
            .Include(i => i.Equipment)
            .Where(i => i.TechnicianId == null)
            .Select(i => new
            {
                i.Id,
                i.Title,
                i.Description,
                i.Priority,
                i.Status,
                i.CreatedAt,
                ClientName = i.Client!.CompanyName,
                EquipmentName = i.Equipment!.Name,
                i.TechnicianId
            })
            .ToListAsync();

        return Ok(interventions);
    }

    [HttpGet("my")]
    [Authorize(Roles = "Technician,Client")]
    public async Task<IActionResult> GetMyInterventions(string? search, string? status, string? priority)
    {
        if (User.IsInRole("Technician"))
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Forbid();
            }

            var interventionsQuery = _context.Interventions
                .Include(i => i.Client)
                .Include(i => i.Equipment)
                .Include(i => i.Report)
                .Where(i => i.TechnicianId == userId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                interventionsQuery = interventionsQuery.Where(i => i.Title.Contains(term) || i.Description != null && i.Description.Contains(term) || i.Client != null && i.Client.CompanyName.Contains(term) || i.Equipment != null && i.Equipment.Name.Contains(term));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                interventionsQuery = interventionsQuery.Where(i => i.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(priority))
            {
                interventionsQuery = interventionsQuery.Where(i => i.Priority == priority);
            }

            var interventions = await interventionsQuery
                .Select(i => new
                {
                    i.Id,
                    i.Title,
                    i.Description,
                    i.Priority,
                    i.Status,
                    i.CreatedAt,
                    ClientName = i.Client!.CompanyName,
                    EquipmentName = i.Equipment!.Name,
                    i.TechnicianId,
                    HasReport = i.Report != null,
                    ReportId = i.Report != null ? i.Report.Id : (int?)null
                })
                .ToListAsync();

            return Ok(interventions);
        }

        var email = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email))
        {
            return Forbid();
        }

        var client = await _context.Clients.FirstOrDefaultAsync(c => c.Email == email);
        if (client == null)
        {
            return Ok(Array.Empty<object>());
        }

        var myInterventionsQuery = _context.Interventions
            .Include(i => i.Client)
            .Include(i => i.Equipment)
            .Include(i => i.Report)
            .Where(i => i.ClientId == client.Id)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            myInterventionsQuery = myInterventionsQuery.Where(i => i.Title.Contains(term) || i.Description != null && i.Description.Contains(term) || i.Equipment != null && i.Equipment.Name.Contains(term) || i.Client != null && i.Client.CompanyName.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            myInterventionsQuery = myInterventionsQuery.Where(i => i.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(priority))
        {
            myInterventionsQuery = myInterventionsQuery.Where(i => i.Priority == priority);
        }

        var myInterventions = await myInterventionsQuery
            .Select(i => new
            {
                i.Id,
                i.Title,
                i.Description,
                i.Priority,
                i.Status,
                i.CreatedAt,
                ClientName = i.Client!.CompanyName,
                EquipmentName = i.Equipment!.Name,
                i.TechnicianId,
                TechnicianName = i.Technician != null ? i.Technician.FullName : null
            })
            .ToListAsync();

        return Ok(myInterventions);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Client")]
    public async Task<IActionResult> CreateIntervention([FromBody] InterventionDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { message = "Le titre de l’intervention est requis." });
        }

        if (request.EquipmentId <= 0)
        {
            return BadRequest(new { message = "Veuillez sélectionner un équipement valide." });
        }

        var equipment = await _context.Equipments.FindAsync(request.EquipmentId);
        if (equipment == null)
        {
            return BadRequest(new { message = "Équipement introuvable." });
        }

        int clientId;
        if (User.IsInRole("Client"))
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrWhiteSpace(email))
            {
                return Forbid();
            }

            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Email == email);
            if (client == null)
            {
                return BadRequest(new { message = "Profil client introuvable." });
            }

            if (equipment.ClientId != client.Id)
            {
                return BadRequest(new { message = "Cet équipement ne vous appartient pas." });
            }

            clientId = client.Id;
        }
        else
        {
            if (request.ClientId <= 0)
            {
                return BadRequest(new { message = "Veuillez sélectionner un client valide pour l'intervention." });
            }
            clientId = request.ClientId;
        }

        var intervention = new Intervention
        {
            Title = request.Title,
            Description = request.Description,
            Priority = string.IsNullOrWhiteSpace(request.Priority) ? "Moyenne" : request.Priority,
            Status = User.IsInRole("Client") ? "Pending" : string.IsNullOrWhiteSpace(request.Status) ? "Pending" : request.Status,
            EquipmentId = equipment.Id,
            TechnicianId = User.IsInRole("Client") ? null : request.TechnicianId,
            ClientId = clientId
        };

        if (User.IsInRole("Client"))
        {
            intervention.Status = "Pending";
        }

        _context.Interventions.Add(intervention);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetInterventions), null, new
        {
            intervention.Id,
            intervention.Title,
            intervention.Description,
            intervention.Priority,
            intervention.Status,
            intervention.CreatedAt,
            intervention.ClientId,
            intervention.EquipmentId,
            intervention.TechnicianId
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateIntervention(int id, InterventionDto request)
    {
        var intervention = await _context.Interventions.FindAsync(id);
        if (intervention == null) return NotFound();

        intervention.Title = request.Title;
        intervention.Description = request.Description;
        intervention.Priority = request.Priority;
        intervention.Status = request.Status;
        intervention.ClientId = request.ClientId;
        intervention.EquipmentId = request.EquipmentId;
        intervention.TechnicianId = request.TechnicianId;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id}/assign")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AssignTechnician(int id, [FromBody] AssignTechnicianDto request)
    {
        if (request == null || request.TechnicianId <= 0)
        {
            return BadRequest(new { message = "Veuillez fournir un technicien valide." });
        }

        var intervention = await _context.Interventions.FindAsync(id);
        if (intervention == null)
        {
            return NotFound();
        }

        var technician = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.TechnicianId && u.Role == "Technician");
        if (technician == null)
        {
            return BadRequest(new { message = "Technicien introuvable." });
        }

        intervention.TechnicianId = request.TechnicianId;
        intervention.Status = "Assigned";
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id}/start")]
    [Authorize(Roles = "Admin,Technician")]
    public async Task<IActionResult> StartIntervention(int id)
    {
        var intervention = await _context.Interventions.FindAsync(id);
        if (intervention == null)
        {
            return NotFound();
        }

        if (User.IsInRole("Technician"))
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId) || intervention.TechnicianId != userId)
            {
                return Forbid();
            }
        }

        intervention.Status = "In Progress";
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id}/complete")]
    [Authorize(Roles = "Admin,Technician")]
    public async Task<IActionResult> CompleteIntervention(int id)
    {
        var intervention = await _context.Interventions.FindAsync(id);
        if (intervention == null)
        {
            return NotFound();
        }

        if (User.IsInRole("Technician"))
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId) || intervention.TechnicianId != userId)
            {
                return Forbid();
            }
        }

        intervention.Status = "Completed";
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Admin,Technician")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateInterventionStatusDto request)
    {
        var intervention = await _context.Interventions.FindAsync(id);
        if (intervention == null) return NotFound();

        if (User.IsInRole("Technician"))
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId) || intervention.TechnicianId != userId)
            {
                return Forbid();
            }
        }

        intervention.Status = request.Status;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteIntervention(int id)
    {
        var intervention = await _context.Interventions.FindAsync(id);
        if (intervention == null) return NotFound();

        _context.Interventions.Remove(intervention);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
