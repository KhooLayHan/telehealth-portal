using NodaTime;

namespace TeleHealth.Api.Features.Admins.GetAllDepartments;

// Response DTO for a department row returned to admins.
public sealed record AdminDepartmentDto
{
    public required string Slug { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public int StaffMembers { get; init; }
    public Instant CreatedAt { get; init; }
}
