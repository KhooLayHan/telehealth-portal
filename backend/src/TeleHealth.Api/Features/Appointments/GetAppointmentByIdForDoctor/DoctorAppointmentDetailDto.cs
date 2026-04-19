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

    // Consultation (populated when Status = Completed)
    public ConsultationDetailDto? Consultation { get; init; }
}

public sealed record ConsultationDetailDto
{
    public Guid PublicId { get; init; }
    public string Subjective { get; init; } = string.Empty;
    public string Objective { get; init; } = string.Empty;
    public string Assessment { get; init; } = string.Empty;
    public string Plan { get; init; } = string.Empty;
    public LocalDate? FollowUpDate { get; init; }
    public List<PrescriptionDetailDto> Prescriptions { get; init; } = [];
}

public sealed record PrescriptionDetailDto
{
    public Guid PublicId { get; init; }
    public string MedicationName { get; init; } = string.Empty;
    public string Dosage { get; init; } = string.Empty;
    public string Frequency { get; init; } = string.Empty;
    public short DurationDays { get; init; }
    public string TakeWith { get; init; } = string.Empty;
    public List<string> Warnings { get; init; } = [];
    public string Storage { get; init; } = string.Empty;
    public string MissedDose { get; init; } = string.Empty;
}