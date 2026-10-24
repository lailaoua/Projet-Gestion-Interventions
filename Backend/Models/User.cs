using System.ComponentModel.DataAnnotations;

namespace Pfa1.Api.Models;

public class User
{
    public int Id { get; set; }

    [Required]
    public string FullName { get; set; } = null!;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    [Required]
    public string PasswordHash { get; set; } = null!;

    [Required]
    public string Role { get; set; } = "Technician";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Intervention> Interventions { get; set; } = new List<Intervention>();
}
