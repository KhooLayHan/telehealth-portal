namespace TeleHealth.Api.Common.Exceptions.ErrorCodes;

public static class DoctorErrorCodes
{
    public const string NotFound = "Doctor.NotFound";
    public const string QualificationNotFound = "Doctor.QualificationNotFound";
    public const string InvalidSchedule = "Doctor.InvalidSchedule";
    public const string OverlappingSchedule = "Doctor.OverlappingSchedule";
    public const string DepartmentRequired = "Doctor.DepartmentRequired";
}