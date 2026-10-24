using System.ComponentModel.DataAnnotations;

namespace Pfa1.Api.Models;

public class Equipment
{
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = null!;

    public string? Type { get; set; }
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }

    public int? ClientId { get; set; }
    public Client? Client { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? PhotoUrl { get; set; }

    public ICollection<Intervention> Interventions { get; set; } = new List<Intervention>();
}
