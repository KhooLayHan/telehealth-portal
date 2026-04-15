using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Appointments.GetAppointmentByIdForDoctor;

public sealed record DoctorAppointmentDetailDto
{
    public Guid PublicId { get; init; }
    public string Slug { get; init; } = string.Empty;
    public string VisitReason { get; init; } = string.Empty;

    // Patient
    public string PatientName { get; init; } = string.Empty;
    public int PatientAge { get; init; }
    public string PatientGender { get; init; } = string.Empty;

    // Schedule
    public LocalDate Date { get; init; }
    public LocalTime StartTime { get; init; }
    public LocalTime EndTime { get; init; }

    // Status
    public string Status { get; init; } = string.Empty;
    public string StatusColorCode { get; init; } = string.Empty;

    // Symptoms
    public List<Symptom>? Symptoms { get; init; }
}
