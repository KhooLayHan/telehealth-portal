namespace TeleHealth.Api.Features.Appointments.GetAppointmentStatuses;

public sealed record AppointmentStatusesDto
{
    public int Id { get; init; }
    public string Slug { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string ColorCode { get; init; } = string.Empty;
    public bool IsTerminal { get; init; }
    public string Description { get; init; } = string.Empty;
}
