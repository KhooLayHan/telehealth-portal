using NodaTime;

namespace TeleHealth.Contracts;

public sealed record AppointmentBookedEvent(
    Guid AppointmentPublicId,
    Guid PatientPublicId,
    Guid SchedulePublicId,
    Instant OccurredAt,
    string PatientEmail
);
