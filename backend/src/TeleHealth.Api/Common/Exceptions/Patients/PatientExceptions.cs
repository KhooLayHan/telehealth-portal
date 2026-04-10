using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.Patients;

public sealed class PatientNotFoundException : NotFoundException
{
    public PatientNotFoundException(string identifier)
        : base(
            PatientErrorCodes.NotFound,
            "Patient Not Found",
            $"Patient '{identifier}' was not found.",
            $"No patient exists with identifier: {identifier}"
        ) { }
}

public sealed class MedicalRecordNotFoundException : NotFoundException
{
    public MedicalRecordNotFoundException(string patientId)
        : base(
            PatientErrorCodes.MedicalRecordNotFound,
            "Medical Record Not Found",
            "The medical record was not found.",
            $"No medical record found for patient: {patientId}"
        ) { }
}

public sealed class PatientAlreadyRegisteredException : Base.ConflictException
{
    public PatientAlreadyRegisteredException(string identifier)
        : base(
            PatientErrorCodes.AlreadyRegistered,
            "Patient Already Registered",
            "This patient is already registered in the system.",
            $"Patient with identifier '{identifier}' already exists"
        ) { }
}

public sealed class InvalidMedicalDataException : ValidationException
{
    public InvalidMedicalDataException(string field, string reason)
        : base(
            PatientErrorCodes.InvalidMedicalData,
            "Invalid Medical Data",
            $"Invalid medical data provided for field '{field}'.",
            reason
        ) { }
}

public sealed class EmergencyContactRequiredException : ValidationException
{
    public EmergencyContactRequiredException()
        : base(
            PatientErrorCodes.EmergencyContactRequired,
            "Emergency Contact Required",
            "At least one emergency contact is required."
        ) { }
}
