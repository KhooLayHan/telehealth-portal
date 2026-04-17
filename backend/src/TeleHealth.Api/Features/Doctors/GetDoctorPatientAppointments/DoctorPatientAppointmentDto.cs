using NodaTime;

using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Doctors.GetDoctorPatientAppointments;

public sealed record DoctorPatientAppointmentDto
{
    public Guid PublicId { get; init; }
    public LocalDate Date { get; init; }
    public LocalTime StartTime { get; init; }
    public LocalTime EndTime { get; init; }
    public string VisitReason { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string StatusColorCode { get; init; } = string.Empty;
    public List<Symptom>? Symptoms { get; init; }
    public ConsultationSummaryDto? Consultation { get; init; }
}

public sealed record ConsultationSummaryDto
{
    public Guid PublicId { get; init; }
    public string Subjective { get; init; } = string.Empty;
    public string Objective { get; init; } = string.Empty;
    public string Assessment { get; init; } = string.Empty;
    public string Plan { get; init; } = string.Empty;
    public LocalDate? FollowUpDate { get; init; }
    public List<PrescriptionSummaryDto> Prescriptions { get; init; } = [];
}

public sealed record PrescriptionSummaryDto
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

public sealed record GetDoctorPatientAppointmentsResponse
{
    public string PatientName { get; init; } = string.Empty;
    public List<DoctorPatientAppointmentDto> Items { get; init; } = [];
}