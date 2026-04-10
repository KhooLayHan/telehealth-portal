using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.Consultations;

public sealed class ConsultationNotFoundException : NotFoundException
{
    public ConsultationNotFoundException(string consultationId)
        : base(
            ConsultationErrorCodes.NotFound,
            "Consultation Not Found",
            $"Consultation '{consultationId}' was not found."
        ) { }
}

public sealed class ConsultationNoteNotFoundException : NotFoundException
{
    public ConsultationNoteNotFoundException(string noteId)
        : base(
            ConsultationErrorCodes.NoteNotFound,
            "Consultation Note Not Found",
            $"Consultation note was not found."
        ) { }
}

public sealed class PrescriptionNotFoundException : NotFoundException
{
    public PrescriptionNotFoundException(string prescriptionId)
        : base(
            ConsultationErrorCodes.PrescriptionNotFound,
            "Prescription Not Found",
            "Prescription was not found."
        ) { }
}

public sealed class ConsultationAlreadyExistsException : Base.ConflictException
{
    public ConsultationAlreadyExistsException(string appointmentId)
        : base(
            ConsultationErrorCodes.AlreadyExists,
            "Consultation Already Exists",
            "A consultation already exists for this appointment."
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
            "Invalid prescription data was provided."
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
            "The patient must be checked in before starting a consultation."
        ) { }
}
