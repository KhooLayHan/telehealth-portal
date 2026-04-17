using Serilog;

using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.Patients;

public sealed class PatientNotFoundException : NotFoundException
{
    public PatientNotFoundException()
        : base(
            PatientErrorCodes.NotFound,
            "Patient Not Found",
            "The requested patient could not be found."
        )
    { }
}

public sealed class MedicalRecordNotFoundException : NotFoundException
{
    public MedicalRecordNotFoundException(Guid patientId)
        : base(
            PatientErrorCodes.MedicalRecordNotFound,
            "Medical Record Not Found",
            "No medical record was found for this patient."
        )
    {
        Log.Warning("Medical record not found. PatientId: {PatientId}", patientId);
    }
}

public sealed class PatientAlreadyRegisteredException : ConflictException
{
    public PatientAlreadyRegisteredException()
        : base(
            PatientErrorCodes.AlreadyRegistered,
            "Patient Already Registered",
            "A patient with these details is already registered."
        )
    {
        Log.Warning("Duplicate patient registration attempt detected.");
    }
}

public sealed class InvalidMedicalDataException : ValidationException
{
    public InvalidMedicalDataException()
        : base(
            PatientErrorCodes.InvalidMedicalData,
            "Invalid Medical Data",
            "Invalid medical data was provided."
        )
    { }
}

public sealed class EmergencyContactRequiredException : ValidationException
{
    public EmergencyContactRequiredException()
        : base(
            PatientErrorCodes.EmergencyContactRequired,
            "Emergency Contact Required",
            "At least one emergency contact is required."
        )
    { }
}