using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.Appointments;

public sealed class AppointmentNotFoundException : NotFoundException
{
    public AppointmentNotFoundException(string appointmentId)
        : base(
            AppointmentErrorCodes.NotFound,
            "Appointment Not Found",
            $"Appointment '{appointmentId}' was not found."
        ) { }
}

public sealed class DoctorScheduleNotFoundException : NotFoundException
{
    public DoctorScheduleNotFoundException(string scheduleId)
        : base(
            AppointmentErrorCodes.ScheduleNotFound,
            "Schedule Not Found",
            $"Schedule '{scheduleId}' was not found."
        ) { }
}

public sealed class ScheduleSlotNotFoundException : NotFoundException
{
    public ScheduleSlotNotFoundException(string slotId)
        : base(
            AppointmentErrorCodes.ScheduleSlotNotFound,
            "Schedule Slot Not Found",
            $"Schedule slot '{slotId}' was not found."
        ) { }
}

public sealed class ScheduleSlotUnavailableException : Base.ConflictException
{
    public ScheduleSlotUnavailableException(string? scheduleId = null)
        : base(
            AppointmentErrorCodes.ScheduleUnavailable,
            "Schedule Slot Unavailable",
            "This schedule slot is no longer available."
        ) { }
}

public sealed class AppointmentTimeConflictException : Base.ConflictException
{
    public AppointmentTimeConflictException(string? existingAppointmentId = null)
        : base(
            AppointmentErrorCodes.TimeConflict,
            "Appointment Time Conflict",
            "You already have an appointment at this time."
        ) { }
}

public sealed class ScheduleExpiredException : Base.ConflictException
{
    public ScheduleExpiredException(DateTimeOffset expiredDate)
        : base(
            AppointmentErrorCodes.ScheduleExpired,
            "Schedule Expired",
            "This schedule slot has expired."
        ) { }
}

public sealed class AppointmentAlreadyCompletedException : Base.ConflictException
{
    public AppointmentAlreadyCompletedException(string appointmentId)
        : base(
            AppointmentErrorCodes.AlreadyCompleted,
            "Appointment Already Completed",
            "This appointment has already been completed."
        ) { }
}

public sealed class AppointmentAlreadyCancelledException : Base.ConflictException
{
    public AppointmentAlreadyCancelledException(string appointmentId)
        : base(
            AppointmentErrorCodes.AlreadyCancelled,
            "Appointment Already Cancelled",
            "This appointment has already been cancelled."
        ) { }
}

public sealed class ConcurrentBookingException : Base.ConflictException
{
    public ConcurrentBookingException()
        : base(
            AppointmentErrorCodes.ConcurrentModification,
            "Concurrent Booking Detected",
            "Another user booked this slot simultaneously. Please try again."
        ) { }
}

public sealed class InvalidAppointmentTimeException : ValidationException
{
    public InvalidAppointmentTimeException(string reason)
        : base(
            AppointmentErrorCodes.InvalidTime,
            "Invalid Appointment Time",
            "The selected appointment time is invalid."
        ) { }
}

public sealed class PastAppointmentException : ValidationException
{
    public PastAppointmentException()
        : base(
            AppointmentErrorCodes.PastAppointment,
            "Cannot Book Past Appointment",
            "Appointments cannot be booked for past dates or times."
        ) { }
}

public sealed class TooShortNoticeException : ValidationException
{
    public TooShortNoticeException(TimeSpan requiredNotice)
        : base(
            AppointmentErrorCodes.TooShortNotice,
            "Insufficient Notice",
            "This appointment requires more advance notice."
        ) { }
}

public sealed class InvalidRescheduleException : ValidationException
{
    public InvalidRescheduleException(string reason)
        : base(
            AppointmentErrorCodes.InvalidReschedule,
            "Cannot Reschedule",
            "This appointment cannot be rescheduled."
        ) { }
}

public sealed class DoctorNotAvailableException : ValidationException
{
    public DoctorNotAvailableException(string doctorName, DateTimeOffset date)
        : base(
            AppointmentErrorCodes.DoctorNotAvailable,
            "Doctor Not Available",
            "The selected doctor is not available at that time."
        ) { }
}

public sealed class PatientRequiredException : ValidationException
{
    public PatientRequiredException()
        : base(
            AppointmentErrorCodes.PatientRequired,
            "Patient Required",
            "A patient is required to book an appointment."
        ) { }
}
