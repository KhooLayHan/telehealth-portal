namespace TeleHealth.Api.Common;

public class ApiEndpoints
{
    private const string ApiBase = "api";
    private const string VersionBase = $"{ApiBase}/v1";

    public static class Patients
    {
        private const string Base = $"{VersionBase}/patients";

        private const string Me = $"{Base}/me";

        private const string MedicalInfo = $"{Base}/me/medical-info";

        private const string GetById = $"{Base}/{{id:guid}}";
    }

    public static class Auth
    {
        private const string Base = $"{VersionBase}/auth";

        private const string Login = $"{Base}/login";

        private const string SignUpPatient = $"{Base}/signup-patient";
    }
}
