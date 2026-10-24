using System.ComponentModel.DataAnnotations;

namespace Pfa1.Api.Models;

public class Report
{
    public int Id { get; set; }

    public int InterventionId { get; set; }
    public Intervention? Intervention { get; set; }

    public string? Cause { get; set; }
    public string? Diagnostic { get; set; }
    public string? Solution { get; set; }
    public string? PartsReplaced { get; set; }
    public string? TestsPerformed { get; set; }
    public string? Duration { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? Notes { get; set; }
    public string? Recommendations { get; set; }
    public DateTime ReportDate { get; set; } = DateTime.UtcNow;
}
