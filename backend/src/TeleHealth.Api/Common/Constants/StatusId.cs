namespace TeleHealth.Api.Common.Constants;

public static class StatusId
{
    public static class Schedule
    {
        public const int Available = 1;
        public const int Booked = 2;
        public const int Blocked = 3;
    }

    public static class Appointment
    {
        public const int Booked = 1;
        public const int CheckedIn = 2;
        public const int InProgress = 3;
        public const int Completed = 4;
        public const int Cancelled = 5;
        public const int NoShow = 6;
    }

    public static class LabReport
    {
        public const int Pending = 1;
        public const int Processing = 2;
        public const int Completed = 3;
        public const int Rejected = 4;
    }
}
