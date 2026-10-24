using System.ComponentModel.DataAnnotations;

namespace Pfa1.Api.DTOs;

public class InterventionDto
{
    [Required]
    public string Title { get; set; } = null!;

    public string? Description { get; set; }
    public string Priority { get; set; } = "Normal";
    public string Status { get; set; } = "Pending";
    public int ClientId { get; set; }
    public int EquipmentId { get; set; }
    public int? TechnicianId { get; set; }
}

public class UpdateInterventionStatusDto
{
    [Required]
    public string Status { get; set; } = null!;
}

public class AssignTechnicianDto
{
    [Required]
    public int TechnicianId { get; set; }
}

public class ReportDto
{
    [Required]
    public string Cause { get; set; } = null!;

    public string? Diagnostic { get; set; }

    [Required]
    public string Solution { get; set; } = null!;

    public string? PartsReplaced { get; set; }
    public string? TestsPerformed { get; set; }
    public string? Duration { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? Notes { get; set; }
    public string? Recommendations { get; set; }
}

public class CreateReportDto
{
    [Required]
    public int InterventionId { get; set; }

    [Required]
    public string Cause { get; set; } = null!;

    public string? Diagnostic { get; set; }

    [Required]
    public string Solution { get; set; } = null!;

    public string? PartsReplaced { get; set; }
    public string? TestsPerformed { get; set; }
    public string? Duration { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? Notes { get; set; }
    public string? Recommendations { get; set; }
}
