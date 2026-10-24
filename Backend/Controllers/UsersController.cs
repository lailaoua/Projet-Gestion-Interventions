using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pfa1.Api.Data;
using Pfa1.Api.DTOs;
using Pfa1.Api.Models;
using System.Security.Cryptography;
using System.Security.Claims;
using System.Text;

namespace Pfa1.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UsersController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .Where(u => u.Role != "Client")
            .Select(u => new { u.Id, u.FullName, u.Email, u.Phone, u.Role, u.CreatedAt })
            .ToListAsync();
        return Ok(users);
    }

    [HttpGet("technicians")]
    public async Task<IActionResult> GetTechnicians()
    {
        var technicians = await _context.Users
            .Where(u => u.Role == "Technician")
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                ActiveInterventions = _context.Interventions.Count(i => i.TechnicianId == u.Id && i.Status != "Completed")
            })
            .ToListAsync();

        return Ok(technicians);
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser(RegisterUserDto request)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail))
        {
            return BadRequest(new { message = "Cet email est déjà utilisé." });
        }

        var user = new User
        {
            FullName = request.FullName,
            Email = normalizedEmail,
            Phone = request.Phone,
            Role = request.Role,
            PasswordHash = ComputeHash(request.Password),
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetUsers), new { id = user.Id }, user);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, RegisterUserDto request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        var normalizedEmail = NormalizeEmail(request.Email);
        user.FullName = request.FullName;
        user.Email = normalizedEmail;
        user.Phone = request.Phone;
        user.Role = request.Role;
        if (!string.IsNullOrEmpty(request.Password))
        {
            user.PasswordHash = ComputeHash(request.Password);
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static string NormalizeEmail(string? email)
    {
        return email?.Trim().ToLowerInvariant() ?? string.Empty;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static string ComputeHash(string input)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(input);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToHexString(hash);
    }
}
