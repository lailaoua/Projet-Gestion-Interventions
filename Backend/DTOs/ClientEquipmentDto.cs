using System.ComponentModel.DataAnnotations;

namespace Pfa1.Api.DTOs;

public class ClientDto
{
    [Required]
    public string CompanyName { get; set; } = null!;

    public string? ContactPerson { get; set; }
    public string? Phone { get; set; }
    [EmailAddress]
    public string? Email { get; set; }
    public string? Address { get; set; }
}

public class EquipmentDto
{
    [Required]
    public string Name { get; set; } = null!;

    public string? Type { get; set; }
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public int? ClientId { get; set; }
}
