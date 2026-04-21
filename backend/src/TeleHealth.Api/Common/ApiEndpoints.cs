namespace TeleHealth.Api.Common;

public static class ApiEndpoints
{
    public const string ApiBase = "api";
    public const int MajorVersion = 1;
    public const int MinorVersion = 0;

    public static class Auth
    {
        private const string Base = "auth";

        public const string Login = $"{Base}/login";

        public const string SignUpPatient = $"{Base}/signup-patient";
    }

    public static class Patients
    {
        private const string Base = "patients";

        public const string Create = Base;

        private const string Me = $"{Base}/me";

        public const string GetProfile = Me;

        public const string UpdateMedicalRecord = $"{GetProfile}/medical-record";

        private const string AppointmentsBase = $"{GetProfile}/appointments";

        public const string GetAllAppointments = AppointmentsBase;

        public const string GetAppointmentByIdOrSlug = $"{AppointmentsBase}/{{idOrSlug}}";

        public const string UpdateAppointmentBySlug = $"{AppointmentsBase}/{{slug}}/reschedule";

        public const string DeleteAppointmentBySlug = $"{AppointmentsBase}/{{slug}}";

        public const string GetById = $"{Base}/{{id:guid}}";

        public const string GetPatientAppointmentsForReceptionist =
            $"{Base}/{{id:guid}}/appointments";

        public const string GetAllPatientsForReceptionist = Base;

        public const string GetAllPatientsForClinicStaff = $"{Base}/staff";
    }

    public static class Appointments
    {
        private const string Base = "appointments";

        public const string CreateAppointment = Base;

        public const string GetById = $"{Base}/{{id:guid}}";

        public const string GetByIdForDoctor = $"{Base}/{{id:guid}}/doctor";

        public const string SubmitConsultation = $"{Base}/{{id:guid}}/consultation";

        public const string GetAllAppointments = Base;

        public const string GetAllStatuses = $"{Base}/statuses";

        public const string UpdateById = $"{Base}/{{id:guid}}";
    }

    public static class Doctors
    {
        private const string Base = "doctors";

        public const string CreateDoctor = Base;

        public const string GetSchedule = $"{Base}/me/schedule";

        public const string GetPatients = $"{Base}/me/patients";

        public const string GetPatientAppointments =
            $"{Base}/me/patients/{{patientPublicId:guid}}/appointments";

        public const string GetByIdOrSlug = $"{Base}/{{idOrSlug}}";

        public const string GetAll = Base;
    }

    public static class Schedules
    {
        private const string Base = "schedules";

        public const string CreateSchedule = Base;

        public const string GetByIdOrSlug = $"{Base}/{{idOrSlug}}";

        public const string GetAll = Base;

        public const string GetAllAvailable = $"{Base}/available";

        public const string GetDailyForReceptionist = $"{Base}/daily";

        public const string UpdateById = $"{Base}/{{id:guid}}";

        public const string DeleteById = $"{Base}/{{id:guid}}";
    }

    public static class LabReports
    {
        private const string Base = "lab-reports";

        public const string Create = $"{Base}/initialize";

        public const string GetBySlug = $"{Base}/{{slug}}/download";

        public const string UpdateBySlug = $"{Base}/{{slug}}/complete";
    }
}
