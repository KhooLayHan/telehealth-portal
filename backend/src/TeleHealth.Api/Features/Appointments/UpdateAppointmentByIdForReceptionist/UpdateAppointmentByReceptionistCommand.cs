namespace TeleHealth.Api.Features.Appointments.UpdateAppointmentByIdForReceptionist;

public sealed record UpdateAppointmentByReceptionistCommand(
    string StatusSlug,
    Guid SchedulePublicId,
    string? CancellationReason
);