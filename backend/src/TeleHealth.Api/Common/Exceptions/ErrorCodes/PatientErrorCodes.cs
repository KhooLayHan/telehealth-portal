namespace TeleHealth.Api.Common.Exceptions.ErrorCodes;

public static class PatientErrorCodes
{
    public const string NotFound = "Patient.NotFound";
    public const string MedicalRecordNotFound = "Patient.MedicalRecordNotFound";
    public const string AlreadyRegistered = "Patient.AlreadyRegistered";
    public const string InvalidMedicalData = "Patient.InvalidMedicalData";
    public const string EmergencyContactRequired = "Patient.EmergencyContactRequired";
}