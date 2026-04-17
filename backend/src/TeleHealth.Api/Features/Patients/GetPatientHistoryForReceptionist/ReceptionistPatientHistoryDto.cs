using NodaTime;

using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Features.Doctors.GetDoctorPatientAppointments;

namespace TeleHealth.Api.Features.Patients.GetPatientHistoryForReceptionist;

public sealed record ReceptionistPatientAppointmentDto
{
    public Guid PublicId { get; init; }
    public LocalDate Date { get; init; }
    public LocalTime StartTime { get; init; }
    public LocalTime EndTime { get; init; }
    public string VisitReason { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string StatusColorCode { get; init; } = string.Empty;
    public string DoctorName { get; init; } = string.Empty;
    public string DoctorSpecialization { get; init; } = string.Empty;
    public List<Symptom>? Symptoms { get; init; }
    public ConsultationSummaryDto? Consultation { get; init; }
}

public sealed record ReceptionistPatientHistoryResponse
{
    public string PatientName { get; init; } = string.Empty;
    public List<ReceptionistPatientAppointmentDto> Items { get; init; } = [];
}