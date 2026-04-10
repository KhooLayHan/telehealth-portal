using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.Appointments;

public sealed class AppointmentNotFoundException : NotFoundException
{
    public AppointmentNotFoundException(string appointmentId)
        : base(
            AppointmentErrorCodes.NotFound,
            "Appointment Not Found",
            "The requested appointment was not found.",
            $"Appointment {appointmentId} not found"
        ) { }
}

public sealed class DoctorScheduleNotFoundException : NotFoundException
{
    public DoctorScheduleNotFoundException(string scheduleId)
        : base(
            AppointmentErrorCodes.ScheduleNotFound,
            "Schedule Not Found",
            "The requested schedule was not found.",
            $"Schedule {scheduleId} not found"
        ) { }
}

public sealed class ScheduleSlotNotFoundException : NotFoundException
{
    public ScheduleSlotNotFoundException(string slotId)
        : base(
            AppointmentErrorCodes.ScheduleSlotNotFound,
            "Schedule Slot Not Found",
            "The requested schedule slot was not found.",
            $"Schedule slot {slotId} not found"
        ) { }
}

public sealed class ScheduleSlotUnavailableException : ConflictException
{
    public ScheduleSlotUnavailableException(string? scheduleId = null)
        : base(
            AppointmentErrorCodes.ScheduleUnavailable,
            "Schedule Slot Unavailable",
            "This schedule slot is no longer available.",
            scheduleId is null ? null : $"Schedule {scheduleId} is already booked"
        ) { }
}

public sealed class AppointmentTimeConflictException : ConflictException
{
    public AppointmentTimeConflictException(string? existingAppointmentId = null)
        : base(
            AppointmentErrorCodes.TimeConflict,
            "Appointment Time Conflict",
            "You already have an appointment at this time.",
            existingAppointmentId is null
                ? null
                : $"Conflicts with appointment {existingAppointmentId}"
        ) { }
}

public sealed class ScheduleExpiredException : Base.ConflictException
{
    public ScheduleExpiredException(DateTimeOffset expiredDate)
        : base(
            AppointmentErrorCodes.ScheduleExpired,
            "Schedule Expired",
            "This schedule slot has expired.",
            $"Slot expired on {expiredDate:yyyy-MM-dd HH:mm}"
        ) { }
}

public sealed class AppointmentAlreadyCompletedException : Base.ConflictException
{
    public AppointmentAlreadyCompletedException(string appointmentId)
        : base(
            AppointmentErrorCodes.AlreadyCompleted,
            "Appointment Already Completed",
            "This appointment has already been completed.",
            $"Appointment {appointmentId} is already marked as completed"
        ) { }
}

public sealed class AppointmentAlreadyCancelledException : Base.ConflictException
{
    public AppointmentAlreadyCancelledException(string appointmentId)
        : base(
            AppointmentErrorCodes.AlreadyCancelled,
            "Appointment Already Cancelled",
            "This appointment has already been cancelled.",
            $"Appointment {appointmentId} is already cancelled"
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
            $"The selected appointment time is invalid: {reason}",
            reason
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
            "This appointment requires more advance notice.",
            $"Appointments must be booked at least {requiredNotice.TotalHours} hours in advance"
        ) { }
}

public sealed class InvalidRescheduleException : ValidationException
{
    public InvalidRescheduleException(string reason)
        : base(
            AppointmentErrorCodes.InvalidReschedule,
            "Cannot Reschedule",
            "This appointment cannot be rescheduled.",
            reason
        ) { }
}

public sealed class DoctorNotAvailableException : ValidationException
{
    public DoctorNotAvailableException(string doctorName, DateTimeOffset date)
        : base(
            AppointmentErrorCodes.DoctorNotAvailable,
            "Doctor Not Available",
            $"Dr. {doctorName} is not available on {date:yyyy-MM-dd}.",
            $"Doctor is on leave or has no available slots on {date:yyyy-MM-dd}"
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
