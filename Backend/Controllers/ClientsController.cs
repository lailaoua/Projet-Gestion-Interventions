using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pfa1.Api.Data;
using Pfa1.Api.DTOs;
using Pfa1.Api.Models;

namespace Pfa1.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ClientsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetClients()
    {
        var clients = await _context.Clients
            .Include(c => c.Equipments)
            .Select(c => new
            {
                c.Id,
                c.CompanyName,
                c.ContactPerson,
                c.Phone,
                c.Email,
                c.Address,
                c.CreatedAt,
                EquipmentCount = c.Equipments.Count
            })
            .ToListAsync();
        return Ok(clients);
    }

    [HttpGet("me")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> GetMyProfile()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(email))
        {
            return Forbid();
        }

        var client = await _context.Clients
            .Include(c => c.Equipments)
            .Include(c => c.Interventions)
            .FirstOrDefaultAsync(c => c.Email == email);

        if (client == null)
        {
            return NotFound(new { message = "Profil client introuvable." });
        }

        return Ok(new
        {
            client.Id,
            client.CompanyName,
            client.ContactPerson,
            client.Email,
            client.Phone,
            client.Address,
            EquipmentCount = client.Equipments.Count,
            InterventionCount = client.Interventions.Count,
            PendingCount = client.Interventions.Count(i => i.Status == "Pending"),
            InProgressCount = client.Interventions.Count(i => i.Status == "In Progress"),
            CompletedCount = client.Interventions.Count(i => i.Status == "Completed")
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateClient(ClientDto request)
    {
        var normalizedEmail = request.Email?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return BadRequest(new { message = "L'email du client est requis." });
        }

        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail))
        {
            return BadRequest(new { message = "Un compte utilisateur existe déjà pour cet email." });
        }

        var client = new Client
        {
            CompanyName = request.CompanyName,
            ContactPerson = request.ContactPerson,
            Phone = request.Phone,
            Email = normalizedEmail,
            Address = request.Address
        };

        var user = new User
        {
            FullName = request.CompanyName,
            Email = normalizedEmail,
            Role = "Client",
            PasswordHash = ComputeHash("123456")
        };

        _context.Clients.Add(client);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetClients), new { id = client.Id }, client);
    }

    private static string NormalizeEmail(string? email)
    {
        return email?.Trim().ToLowerInvariant() ?? string.Empty;
    }

    private static string ComputeHash(string input)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(input);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToHexString(hash);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateClient(int id, ClientDto request)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null) return NotFound();

        client.CompanyName = request.CompanyName;
        client.ContactPerson = request.ContactPerson;
        client.Phone = request.Phone;
        client.Email = NormalizeEmail(request.Email);
        client.Address = request.Address;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteClient(int id)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null) return NotFound();

        _context.Clients.Remove(client);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
