using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Appointments.GetAppointmentsById;

public sealed record ReceptionistAppointmentDetailDto
{
    public Guid PublicId { get; init; }
    public string Slug { get; init; } = string.Empty;
    public string VisitReason { get; init; } = string.Empty;
    public string? CancellationReason { get; init; }

    // Patient
    public string PatientName { get; init; } = string.Empty;

    // Doctor
    public Guid DoctorPublicId { get; init; }
    public string DoctorName { get; init; } = string.Empty;
    public string Specialization { get; init; } = string.Empty;

    // Schedule
    public Guid SchedulePublicId { get; init; }
    public LocalDate Date { get; init; }
    public LocalTime StartTime { get; init; }
    public LocalTime EndTime { get; init; }

    // Status
    public string Status { get; init; } = string.Empty;
    public string StatusSlug { get; init; } = string.Empty;
    public string StatusColorCode { get; init; } = string.Empty;

    // Symptoms
    public List<Symptom>? Symptoms { get; init; }
}
