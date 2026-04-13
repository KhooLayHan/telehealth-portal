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

        private const string Me = $"{Base}/me";

        public const string GetProfile = Me;

        public const string UpdateMedicalRecord = $"{GetProfile}/medical-record";

        public const string GetAllAppointments = $"{GetProfile}/appointments";

        public const string GetAppointmentByIdOrSlug = $"{GetProfile}/appointments/{{idOrSlug}}";

        public const string GetAppointmentBySlug = $"{GetProfile}/appointments/{{slug}}";

        public const string UpdateAppointmentBySlug =
            $"{GetProfile}/appointments/{{slug}}/reschedule";

        public const string DeleteAppointmentBySlug = $"{GetProfile}/appointments/{{slug}}";

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

    public static class Appointments
    {
        private const string Base = "appointments";

        public const string Create = Base;

        public const string GetById = $"{Base}/{{id:guid}}";

        public const string GetAllAppointments = Base;
    }
}
