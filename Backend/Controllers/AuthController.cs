using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Pfa1.Api.Data;
using Pfa1.Api.DTOs;
using Pfa1.Api.Models;
using Pfa1.Api.Services;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Pfa1.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IJwtService _jwtService;

    public AuthController(ApplicationDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto request)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        var password = request.Password?.Trim() ?? string.Empty;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user == null || user.PasswordHash != ComputeHash(password))
        {
            return Unauthorized(new { message = "Email ou mot de passe invalide." });
        }

        var token = _jwtService.GenerateToken(user);
        return Ok(new
        {
            token,
            user = new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Phone,
                user.Role
            }
        });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterUserDto request)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail))
        {
            return BadRequest(new { message = "Cet email est déjà utilisé." });
        }

        var normalizedRole = string.IsNullOrWhiteSpace(request.Role) ? "Client" : request.Role.Trim();
        if (normalizedRole != "Admin" && normalizedRole != "Technician" && normalizedRole != "Client")
        {
            normalizedRole = "Client";
        }

        var user = new User
        {
            FullName = request.FullName,
            Email = normalizedEmail,
            Role = normalizedRole,
            PasswordHash = ComputeHash(request.Password)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        if (normalizedRole == "Client")
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Email == normalizedEmail);
            if (client == null)
            {
                _context.Clients.Add(new Client
                {
                    CompanyName = string.IsNullOrWhiteSpace(request.CompanyName) ? "Entreprise à définir" : request.CompanyName,
                    ContactPerson = request.FullName,
                    Email = normalizedEmail,
                    Phone = request.Phone ?? string.Empty,
                    Address = request.Address ?? string.Empty
                });
            }
            else
            {
                client.CompanyName = string.IsNullOrWhiteSpace(request.CompanyName) ? client.CompanyName : request.CompanyName;
                client.ContactPerson = request.FullName;
                client.Phone = request.Phone ?? client.Phone;
                client.Address = request.Address ?? client.Address;
            }

            await _context.SaveChangesAsync();
        }

        var token = _jwtService.GenerateToken(user);
        return CreatedAtAction(nameof(Register), new { id = user.Id }, new
        {
            token,
            user = new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Phone,
                user.Role
            }
        });
    }

    private static string NormalizeEmail(string? email)
    {
        return email?.Trim().ToLowerInvariant() ?? string.Empty;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(new
        {
            user.Id,
            user.FullName,
            user.Email,
            user.Phone,
            user.Role,
            user.CreatedAt
        });
    }

    private static string ComputeHash(string input)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(input);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToHexString(hash);
    }
}
