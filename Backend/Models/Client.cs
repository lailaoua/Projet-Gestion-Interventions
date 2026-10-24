using System.ComponentModel.DataAnnotations;

namespace Pfa1.Api.Models;

public class Client
{
    public int Id { get; set; }

    [Required]
    public string CompanyName { get; set; } = null!;

    public string? ContactPerson { get; set; }

    public string? Phone { get; set; }

    [EmailAddress]
    public string? Email { get; set; }

    public string? Address { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Equipment> Equipments { get; set; } = new List<Equipment>();
    public ICollection<Intervention> Interventions { get; set; } = new List<Intervention>();
}
