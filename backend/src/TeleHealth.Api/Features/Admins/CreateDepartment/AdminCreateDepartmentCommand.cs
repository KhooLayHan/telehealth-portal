namespace TeleHealth.Api.Features.Admins.CreateDepartment;

// Represents the admin request for creating a department.
public sealed record AdminCreateDepartmentCommand(string Name, string? Description);
