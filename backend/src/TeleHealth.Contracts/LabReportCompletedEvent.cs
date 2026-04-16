using NodaTime;

namespace TeleHealth.Contracts;

public sealed record LabReportCompletedEvent(
    Guid LabReportPublicId,
    Guid PatientPublicId,
    string ReportType,
    Instant OccurredAt
);
