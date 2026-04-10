using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.Consultations;

public sealed class ConsultationNotFoundException : NotFoundException
{
    public ConsultationNotFoundException(string consultationId)
        : base(
            ConsultationErrorCodes.NotFound,
            "Consultation Not Found",
            "The requested consultation was not found.",
            $"Consultation {consultationId} not found"
        ) { }
}

public sealed class ConsultationNoteNotFoundException : NotFoundException
{
    public ConsultationNoteNotFoundException(string noteId)
        : base(
            ConsultationErrorCodes.NoteNotFound,
            "Consultation Note Not Found",
            "The requested consultation note was not found.",
            $"Note {noteId} not found"
        ) { }
}

public sealed class PrescriptionNotFoundException : NotFoundException
{
    public PrescriptionNotFoundException(string prescriptionId)
        : base(
            ConsultationErrorCodes.PrescriptionNotFound,
            "Prescription Not Found",
            "The requested prescription was not found.",
            $"Prescription {prescriptionId} not found"
        ) { }
}

public sealed class ConsultationAlreadyExistsException : Base.ConflictException
{
    public ConsultationAlreadyExistsException(string appointmentId)
        : base(
            ConsultationErrorCodes.AlreadyExists,
            "Consultation Already Exists",
            "A consultation already exists for this appointment.",
            $"Consultation for appointment {appointmentId} already exists"
        ) { }
}

public sealed class EmptyConsultationNoteException : ValidationException
{
    public EmptyConsultationNoteException()
        : base(
            ConsultationErrorCodes.EmptyNote,
            "Empty Consultation Note",
            "Consultation notes cannot be empty."
        ) { }
}

public sealed class InvalidPrescriptionDataException : ValidationException
{
    public InvalidPrescriptionDataException(string field, string reason)
        : base(
            ConsultationErrorCodes.InvalidPrescription,
            "Invalid Prescription Data",
            $"Invalid prescription data in field '{field}'.",
            reason
        ) { }
}

public sealed class AppointmentRequiredForConsultationException : ValidationException
{
    public AppointmentRequiredForConsultationException()
        : base(
            ConsultationErrorCodes.AppointmentRequired,
            "Appointment Required",
            "A valid appointment is required to create a consultation."
        ) { }
}

public sealed class PatientNotCheckedInException : ValidationException
{
    public PatientNotCheckedInException(string appointmentId)
        : base(
            ConsultationErrorCodes.PatientNotCheckedIn,
            "Patient Not Checked In",
            "The patient must be checked in before starting a consultation.",
            $"Patient for appointment {appointmentId} has not checked in"
        ) { }
}
