namespace TeleHealth.Api.Common.Exceptions.ErrorCodes;

public static class ScheduleErrorCodes
{
    // Validation (400)
    public const string InvalidDate = "Schedule.InvalidDate";
    public const string InvalidTime = "Schedule.InvalidTime";
    public const string InvalidTimeRange = "Schedule.InvalidTimeRange";
    public const string PastSchedule = "Schedule.PastSchedule";
    public const string DoctorRequired = "Schedule.DoctorRequired";
    public const string InvalidStatusTransition = "Schedule.InvalidStatusTransition";

    // Not Found (404)
    public const string NotFound = "Schedule.NotFound";
    public const string DoctorNotFound = "Schedule.DoctorNotFound";

    // Conflict (409)
    public const string NoAvailableSlots = "Schedule.NoAvailableSlots";
    public const string AlreadyBooked = "Schedule.AlreadyBooked";
    public const string AlreadyBlocked = "Schedule.AlreadyBlocked";
    public const string SlotOverlap = "Schedule.SlotOverlap";
    public const string OutsideWorkingHours = "Schedule.OutsideWorkingHours";
    public const string ConcurrentModification = "Schedule.ConcurrentModification";

    // Forbidden (403)
    public const string CannotModifyBooked = "Schedule.CannotModifyBooked";
    public const string CannotModifyBlocked = "Schedule.CannotModifyBlocked";
}