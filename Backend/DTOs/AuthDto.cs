using System.ComponentModel.DataAnnotations;

namespace Pfa1.Api.DTOs;

public class LoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    public string Password { get; set; } = null!;
}

public class RegisterUserDto
{
    [Required]
    public string FullName { get; set; } = null!;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    public string Password { get; set; } = null!;

    public string? CompanyName { get; set; }

    public string? Phone { get; set; }

    public string? Address { get; set; }

    [Required]
    public string Role { get; set; } = "Client";
}
