using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pfa1.Api.Data;
using Pfa1.Api.DTOs;
using Pfa1.Api.Models;

namespace Pfa1.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EquipmentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public EquipmentsController(ApplicationDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    [HttpGet("available")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailableEquipments()
    {
        var equipments = await _context.Equipments
            .Where(e => e.ClientId == null)
            .Select(e => new
            {
                e.Id,
                e.Name,
                e.Type,
                e.Brand,
                e.Model,
                e.SerialNumber,
                e.PhotoUrl,
                InstallationDate = e.CreatedAt,
                Status = GetEquipmentStatus(e)
            })
            .OrderBy(e => e.Name)
            .ToListAsync();
        return Ok(equipments);
    }

    [HttpGet("mine")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> GetMyEquipments()
    {
        return await GetClientEquipmentListAsync();
    }

    [HttpGet("/api/client/equipments")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> GetClientEquipments()
    {
        return await GetClientEquipmentListAsync();
    }

    private async Task<IActionResult> GetClientEquipmentListAsync()
    {
        var clientId = await GetAuthenticatedClientIdAsync();
        if (clientId == null)
        {
            return Ok(Array.Empty<object>());
        }

        var equipments = await _context.Equipments
            .Where(e => e.ClientId == clientId)
            .Select(e => new
            {
                e.Id,
                e.Name,
                e.Type,
                e.Brand,
                e.Model,
                e.SerialNumber,
                e.PhotoUrl,
                InstallationDate = e.CreatedAt,
                Status = GetEquipmentStatus(e)
            })
            .OrderBy(e => e.Name)
            .ToListAsync();

        return Ok(equipments);
    }

    [HttpGet("")]
    [Authorize(Roles = "Admin,Client")]
    public async Task<IActionResult> GetEquipments()
    {
        var query = _context.Equipments.AsQueryable();

        if (User.IsInRole("Client"))
        {
            var clientId = await GetAuthenticatedClientIdAsync();
            if (clientId == null)
            {
                return Ok(Array.Empty<object>());
            }

            query = query.Where(e => e.ClientId == clientId);
        }

        var equipments = await query
            .Include(e => e.Client)
            .Select(e => new
            {
                e.Id,
                e.Name,
                e.Type,
                e.Brand,
                e.Model,
                e.SerialNumber,
                e.PhotoUrl,
                e.ClientId,
                ClientName = e.Client != null ? e.Client.CompanyName : null,
                e.CreatedAt
            })
            .ToListAsync();
        return Ok(equipments);
    }

    [HttpPost("")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateEquipment()
    {
        try
        {
            EquipmentDto? request = null;
            IFormFile? photo = null;

            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                request = new EquipmentDto
                {
                    Name = form["name"],
                    Type = form["type"],
                    Brand = form["brand"],
                    Model = form["model"],
                    SerialNumber = form["serialNumber"],
                    ClientId = int.TryParse(form["clientId"], out var clientId) ? clientId : null
                };
                photo = form.Files["photo"] ?? form.Files.FirstOrDefault();
            }
            else if (Request.ContentType?.StartsWith("application/json", StringComparison.OrdinalIgnoreCase) == true)
            {
                request = await System.Text.Json.JsonSerializer.DeserializeAsync<EquipmentDto>(Request.Body, new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }

            if (request == null)
            {
                return BadRequest(new { message = "La requête est invalide." });
            }

            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Le nom de l'équipement est requis." });

            var equipment = new Equipment
            {
                Name = request.Name,
                Type = request.Type,
                Brand = request.Brand,
                Model = request.Model,
                SerialNumber = request.SerialNumber,
                ClientId = request.ClientId,
                PhotoUrl = await SavePhotoAsync(photo)
            };

            _context.Equipments.Add(equipment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEquipments), new { id = equipment.Id }, new
            {
                equipment.Id,
                equipment.Name,
                equipment.Type,
                equipment.Brand,
                equipment.Model,
                equipment.SerialNumber,
                equipment.ClientId,
                equipment.PhotoUrl,
                equipment.CreatedAt
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erreur lors de la création de l'équipement.", error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateEquipment(int id)
    {
        try
        {
            var equipment = await _context.Equipments.FindAsync(id);
            if (equipment == null) return NotFound();

            EquipmentDto? request = null;
            IFormFile? photo = null;

            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                request = new EquipmentDto
                {
                    Name = form["name"],
                    Type = form["type"],
                    Brand = form["brand"],
                    Model = form["model"],
                    SerialNumber = form["serialNumber"],
                    ClientId = int.TryParse(form["clientId"], out var clientId) ? clientId : null
                };
                photo = form.Files["photo"] ?? form.Files.FirstOrDefault();
            }
            else if (Request.ContentType?.StartsWith("application/json", StringComparison.OrdinalIgnoreCase) == true)
            {
                request = await System.Text.Json.JsonSerializer.DeserializeAsync<EquipmentDto>(Request.Body, new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }

            if (request == null)
            {
                return BadRequest(new { message = "La requête est invalide." });
            }

            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Le nom de l'équipement est requis." });

            equipment.Name = request.Name;
            equipment.Type = request.Type;
            equipment.Brand = request.Brand;
            equipment.Model = request.Model;
            equipment.SerialNumber = request.SerialNumber;
            equipment.ClientId = request.ClientId;

            if (photo != null)
            {
                equipment.PhotoUrl = await SavePhotoAsync(photo);
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erreur lors de la mise à jour de l'équipement.", error = ex.Message });
        }
    }

    [HttpPut("{id}/assign")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> AssignEquipmentToMe(int id)
    {
        try
        {
            var equipment = await _context.Equipments.FindAsync(id);
            if (equipment == null) return NotFound();

            if (equipment.ClientId != null)
                return BadRequest("Cet équipement est déjà assigné à un client.");

            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrWhiteSpace(email))
                return Unauthorized();

            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Email == email);
            if (client == null)
                return NotFound("Profil client non trouvé.");

            equipment.ClientId = client.Id;
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erreur lors de l'assignation de l'équipement.", error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteEquipment(int id)
    {
        try
        {
            var equipment = await _context.Equipments
                .Include(e => e.Interventions)
                .FirstOrDefaultAsync(e => e.Id == id);
            if (equipment == null) return NotFound();

            // Supprimer d'abord les interventions liées
            if (equipment.Interventions.Any())
            {
                _context.Interventions.RemoveRange(equipment.Interventions);
            }

            _context.Equipments.Remove(equipment);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Erreur lors de la suppression de l'équipement.", error = ex.Message });
        }
    }

    private async Task<int?> GetAuthenticatedClientIdAsync()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return null;
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || string.IsNullOrWhiteSpace(user.Email))
        {
            return null;
        }

        var client = await _context.Clients.FirstOrDefaultAsync(c => c.Email == user.Email);
        return client?.Id;
    }

    private static string GetEquipmentStatus(Equipment equipment)
    {
        return equipment.ClientId == null ? "Available" : "Assigned";
    }

    private async Task<string?> SavePhotoAsync(IFormFile? photo)
    {
        if (photo == null || photo.Length == 0)
        {
            return null;
        }

        var uploadsFolder = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsFolder);

        var fileName = $"equipment-{Guid.NewGuid()}{Path.GetExtension(photo.FileName)}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        await using var stream = System.IO.File.Create(filePath);
        await photo.CopyToAsync(stream);

        return $"/uploads/{fileName}";
    }

    [HttpGet("photos/{fileName}")]
    [AllowAnonymous]
    public IActionResult GetEquipmentPhoto(string fileName)
    {
        var uploadsFolder = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");
        var filePath = Path.Combine(uploadsFolder, fileName);

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound();
        }

        var fileExtension = Path.GetExtension(fileName).ToLowerInvariant();
        var contentType = fileExtension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };

        var fileBytes = System.IO.File.ReadAllBytes(filePath);
        return File(fileBytes, contentType);
    }
}
