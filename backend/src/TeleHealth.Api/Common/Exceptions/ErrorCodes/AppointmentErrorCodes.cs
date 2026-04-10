namespace TeleHealth.Api.Common.Exceptions.ErrorCodes;

public static class AppointmentErrorCodes
{
    public const string NotFound = "Appointment.NotFound";
    public const string ScheduleNotFound = "Appointment.ScheduleNotFound";
    public const string ScheduleSlotNotFound = "Appointment.ScheduleSlotNotFound";
    public const string ScheduleUnavailable = "Appointment.ScheduleUnavailable";
    public const string TimeConflict = "Appointment.TimeConflict";
    public const string ScheduleExpired = "Appointment.ScheduleExpired";
    public const string AlreadyCompleted = "Appointment.AlreadyCompleted";
    public const string AlreadyCancelled = "Appointment.AlreadyCancelled";
    public const string ConcurrentModification = "Appointment.ConcurrentModification";
    public const string InvalidTime = "Appointment.InvalidTime";
    public const string PastAppointment = "Appointment.PastAppointment";
    public const string TooShortNotice = "Appointment.TooShortNotice";
    public const string InvalidReschedule = "Appointment.InvalidReschedule";
    public const string DoctorNotAvailable = "Appointment.DoctorNotAvailable";
    public const string PatientRequired = "Appointment.PatientRequired";
}
