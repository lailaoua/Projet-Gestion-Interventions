using System.ComponentModel.DataAnnotations;

namespace Pfa1.Api.DTOs;

public class ContactCreateDto
{
    public string? Name { get; set; }

    public string? Email { get; set; }

    [Required]
    public string Subject { get; set; } = string.Empty;

    [Required]
    public string Message { get; set; } = string.Empty;
}

public class ContactReplyDto
{
    [Required]
    public string Response { get; set; } = string.Empty;
}

public class ContactDto
{
    public int Id { get; set; }
    public int? ClientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Response { get; set; }
    public string Status { get; set; } = "NonLu";
    public DateTime CreatedAt { get; set; }
    public DateTime? RepliedAt { get; set; }
}
