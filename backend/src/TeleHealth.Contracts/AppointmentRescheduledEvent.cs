using NodaTime;

namespace TeleHealth.Contracts;

public sealed record AppointmentRescheduledEvent(
    Guid AppointmentPublicId,
    Guid PatientPublicId,
    string OldDate,
    string OldTime,
    string NewDate,
    string NewTime,
    Instant OccurredAt
);
