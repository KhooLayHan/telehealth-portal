namespace TeleHealth.Api.Common;

public static class ApiEndpoints
{
    public const string ApiBase = "api";
    public const int MajorVersion = 1;
    public const int MinorVersion = 0;

    public static class Patients
    {
        private const string Base = "patients";

        public const string Create = Base;

        public const string Me = $"{Base}/me";

        public const string MedicalRecord = $"{Me}/medical-record";

        public const string GetById = $"{Base}/{{id:guid}}";
    }

    public static class Auth
    {
        private const string Base = "auth";

        public const string Login = $"{Base}/login";

        public const string SignUpPatient = $"{Base}/signup-patient";
    }

    public static class LabReports
    {
        public const string Base = "lab-reports";

        public const string Create = Base;
    }
}
