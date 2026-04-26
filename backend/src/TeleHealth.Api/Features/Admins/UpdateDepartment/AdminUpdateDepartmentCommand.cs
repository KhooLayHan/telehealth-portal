namespace TeleHealth.Api.Features.Admins.UpdateDepartment;

// Carries the editable fields for a department update submitted by the admin.
public sealed record AdminUpdateDepartmentCommand(string Name, string? Description);
