namespace TeleHealth.Api.Common.Exceptions.ErrorCodes;

public static class ConsultationErrorCodes
{
    public const string NotFound = "Consultation.NotFound";
    public const string NoteNotFound = "Consultation.NoteNotFound";
    public const string PrescriptionNotFound = "Consultation.PrescriptionNotFound";
    public const string AlreadyExists = "Consultation.AlreadyExists";
    public const string EmptyNote = "Consultation.EmptyNote";
    public const string InvalidPrescription = "Consultation.InvalidPrescription";
    public const string AppointmentRequired = "Consultation.AppointmentRequired";
    public const string PatientNotCheckedIn = "Consultation.PatientNotCheckedIn";
}
