using System.ComponentModel.DataAnnotations;

namespace Pfa1.Api.Models;

public class Contact
{
    public int Id { get; set; }

    public int? ClientId { get; set; }
    public Client? Client { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Subject { get; set; } = string.Empty;

    [Required]
    [MaxLength(4000)]
    public string Message { get; set; } = string.Empty;

    public string? Response { get; set; }

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "NonLu";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? RepliedAt { get; set; }
}
