using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pfa1.Api.Data;
using Pfa1.Api.DTOs;
using Pfa1.Api.Models;
using System.Security.Claims;

namespace Pfa1.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ContactController> _logger;

    public ContactController(ApplicationDbContext context, ILogger<ContactController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> CreateContact(ContactCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var email = !string.IsNullOrWhiteSpace(dto.Email) ? dto.Email.Trim() : User.FindFirstValue(ClaimTypes.Email)?.Trim();
        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new { message = "L'email est requis pour envoyer un message de contact." });
        }

        var client = await _context.Clients.FirstOrDefaultAsync(c => c.Email != null && c.Email.ToLower() == email.ToLower());
        var name = !string.IsNullOrWhiteSpace(dto.Name)
            ? dto.Name.Trim()
            : User.FindFirstValue(ClaimTypes.Name)?.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            name = client?.ContactPerson ?? client?.CompanyName ?? "Client";
        }

        int? clientId = client?.Id;

        var contact = new Contact
        {
            ClientId = clientId,
            Name = name,
            Email = email,
            Subject = dto.Subject,
            Message = dto.Message,
            Status = "NonLu",
            CreatedAt = DateTime.UtcNow
        };

        _context.Contacts.Add(contact);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save contact");
            return Problem(detail: ex.Message, statusCode: 500);
        }

        return CreatedAtAction(nameof(GetById), new { id = contact.Id }, new { message = "Votre message a été envoyé avec succès à l'administrateur." });
    }

    [HttpGet("my-messages")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> GetMyMessages()
    {
        var email = User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
        var messages = await _context.Contacts
            .Include(c => c.Client)
            .Where(c => c.Email.ToLower() == email.ToLower())
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ContactDto
            {
                Id = c.Id,
                ClientId = c.ClientId,
                Name = !string.IsNullOrWhiteSpace(c.Name)
                    ? c.Name
                    : (c.Client != null && !string.IsNullOrWhiteSpace(c.Client.ContactPerson)
                        ? c.Client.ContactPerson
                        : (c.Client != null && !string.IsNullOrWhiteSpace(c.Client.CompanyName)
                            ? c.Client.CompanyName
                            : "Client")),
                Email = !string.IsNullOrWhiteSpace(c.Email)
                    ? c.Email
                    : (c.Client != null && !string.IsNullOrWhiteSpace(c.Client.Email)
                        ? c.Client.Email
                        : string.Empty),
                Phone = c.Client != null && !string.IsNullOrWhiteSpace(c.Client.Phone)
                    ? c.Client.Phone
                    : string.Empty,
                Subject = c.Subject,
                Message = c.Message,
                Response = c.Response,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                RepliedAt = c.RepliedAt
            })
            .ToListAsync();

        return Ok(messages);
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var messages = await _context.Contacts
            .Include(c => c.Client)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ContactDto
            {
                Id = c.Id,
                ClientId = c.ClientId,
                Name = !string.IsNullOrWhiteSpace(c.Name)
                    ? c.Name
                    : (c.Client != null && !string.IsNullOrWhiteSpace(c.Client.ContactPerson)
                        ? c.Client.ContactPerson
                        : (c.Client != null && !string.IsNullOrWhiteSpace(c.Client.CompanyName)
                            ? c.Client.CompanyName
                            : "Client")),
                Email = !string.IsNullOrWhiteSpace(c.Email)
                    ? c.Email
                    : (c.Client != null && !string.IsNullOrWhiteSpace(c.Client.Email)
                        ? c.Client.Email
                        : string.Empty),
                Phone = c.Client != null && !string.IsNullOrWhiteSpace(c.Client.Phone)
                    ? c.Client.Phone
                    : string.Empty,
                Subject = c.Subject,
                Message = c.Message,
                Response = c.Response,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                RepliedAt = c.RepliedAt
            })
            .ToListAsync();

        return Ok(messages);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetById(int id)
    {
        var c = await _context.Contacts.Include(c => c.Client).FirstOrDefaultAsync(c => c.Id == id);
        if (c == null) return NotFound();

        var dto = new ContactDto
        {
            Id = c.Id,
            ClientId = c.ClientId,
            Name = !string.IsNullOrWhiteSpace(c.Name)
                ? c.Name
                : (c.Client != null && !string.IsNullOrWhiteSpace(c.Client.ContactPerson)
                    ? c.Client.ContactPerson
                    : (c.Client != null && !string.IsNullOrWhiteSpace(c.Client.CompanyName)
                        ? c.Client.CompanyName
                        : "Client")),
            Email = !string.IsNullOrWhiteSpace(c.Email)
                ? c.Email
                : (c.Client != null && !string.IsNullOrWhiteSpace(c.Client.Email)
                    ? c.Client.Email
                    : string.Empty),
            Phone = c.Client != null && !string.IsNullOrWhiteSpace(c.Client.Phone)
                ? c.Client.Phone
                : string.Empty,
            Subject = c.Subject,
            Message = c.Message,
            Response = c.Response,
            Status = c.Status,
            CreatedAt = c.CreatedAt,
            RepliedAt = c.RepliedAt
        };

        return Ok(dto);
    }

    [HttpPut("{id}/read")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var c = await _context.Contacts.FindAsync(id);
        if (c == null) return NotFound();
        c.Status = "Lu";
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id}/reply")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reply(int id, ContactReplyDto dto)
    {
        var c = await _context.Contacts.FindAsync(id);
        if (c == null) return NotFound();
        c.Response = dto.Response;
        c.RepliedAt = DateTime.UtcNow;
        c.Status = "Lu";
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _context.Contacts.FindAsync(id);
        if (c == null) return NotFound();
        _context.Contacts.Remove(c);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
