using System.ComponentModel.DataAnnotations;

namespace Pfa1.Api.Models;

public class Intervention
{
    public int Id { get; set; }

    [Required]
    public string Title { get; set; } = null!;

    public string? Description { get; set; }
    public string Priority { get; set; } = "Normal";
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int ClientId { get; set; }
    public Client? Client { get; set; }

    public int EquipmentId { get; set; }
    public Equipment? Equipment { get; set; }

    public int? TechnicianId { get; set; }
    public User? Technician { get; set; }

    public Report? Report { get; set; }
}
