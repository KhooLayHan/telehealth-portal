using NodaTime;

namespace TeleHealth.Api.Features.Appointments.SubmitConsultation;

public sealed record SubmitConsultationRequest(
    string Subjective,
    string Objective,
    string Assessment,
    string Plan,
    LocalDate? FollowUpDate,
    List<PrescriptionRequest> Prescriptions
);

public sealed record PrescriptionRequest(
    string MedicationName,
    string Dosage,
    string Frequency,
    short DurationDays,
    PrescriptionInstructionsRequest Instructions
);

public sealed record PrescriptionInstructionsRequest(
    string TakeWith,
    List<string> Warnings,
    string Storage,
    string MissedDose
);
