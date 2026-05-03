using NodaTime;

namespace TeleHealth.Contracts;

public sealed record AppointmentCancelledEvent(
    Guid AppointmentPublicId,
    Guid PatientPublicId,
    string Reason,
    Instant OccurredAt,
    string PatientEmail
) { }
