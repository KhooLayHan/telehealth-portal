namespace TeleHealth.Api.Common;

public static class ApiEndpoints
{
    private const string ApiBase = "api";
    private const string VersionBase = $"{ApiBase}/v1";

    public static class Patients
    {
        private const string Base = $"{VersionBase}/patients";

        public const string Me = $"{Base}/me";

        public const string MedicalRecord  = $"{Me}/medical-record";

        public const string GetById = $"{Base}/{{id:guid}}";
    }

    public static class Auth
    {
        private const string Base = $"{VersionBase}/auth";

        public const string Login = $"{Base}/login";

        public const string SignUpPatient = $"{Base}/signup-patient";
    }
}
