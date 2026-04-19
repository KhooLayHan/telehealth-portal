using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.Appointments;

public sealed class AppointmentNotFoundException : NotFoundException
{
    public AppointmentNotFoundException()
        : base(
            AppointmentErrorCodes.NotFound,
            "Appointment Not Found",
            "The requested appointment could not be found."
        ) { }
}

public sealed class DoctorScheduleNotFoundException : NotFoundException
{
    public DoctorScheduleNotFoundException()
        : base(
            AppointmentErrorCodes.ScheduleNotFound,
            "Schedule Not Found",
            "The requested schedule could not be found."
        ) { }
}

public sealed class ScheduleSlotNotFoundException : NotFoundException
{
    public ScheduleSlotNotFoundException(string slotId)
        : base(
            AppointmentErrorCodes.ScheduleSlotNotFound,
            "Schedule Slot Not Found",
            "The requested schedule slot could not be found."
        ) { }
}

public sealed class ScheduleSlotUnavailableException : ConflictException
{
    public ScheduleSlotUnavailableException()
        : base(
            AppointmentErrorCodes.ScheduleUnavailable,
            "Schedule Slot Unavailable",
            "This schedule slot is no longer available."
        ) { }
}

public sealed class AppointmentTimeConflictException : ConflictException
{
    public AppointmentTimeConflictException()
        : base(
            AppointmentErrorCodes.TimeConflict,
            "Appointment Time Conflict",
            "You already have an appointment at this time."
        ) { }
}

public sealed class ScheduleExpiredException : ConflictException
{
    public ScheduleExpiredException()
        : base(
            AppointmentErrorCodes.ScheduleExpired,
            "Schedule Expired",
            "This schedule slot has expired."
        ) { }
}

public sealed class AppointmentAlreadyCompletedException : ConflictException
{
    public AppointmentAlreadyCompletedException()
        : base(
            AppointmentErrorCodes.AlreadyCompleted,
            "Appointment Already Completed",
            "This appointment has already been completed."
        ) { }
}

public sealed class AppointmentAlreadyCancelledException : ConflictException
{
    public AppointmentAlreadyCancelledException()
        : base(
            AppointmentErrorCodes.AlreadyCancelled,
            "Appointment Already Cancelled",
            "This appointment has already been cancelled."
        ) { }
}

public sealed class AppointmentAlreadyTerminatedException : ConflictException
{
    public AppointmentAlreadyTerminatedException(string statusName)
        : base(
            AppointmentErrorCodes.AlreadyTerminated,
            "Appointment Already Terminated",
            $"This appointment cannot be modified because it is already '{statusName}'."
        ) { }
}

public sealed class AppointmentInProgressException : ConflictException
{
    public AppointmentInProgressException()
        : base(
            AppointmentErrorCodes.InProgress,
            "Appointment In Progress",
            "This appointment is currently in progress and cannot be self-cancelled. Please contact the clinic."
        ) { }
}

public sealed class ConcurrentBookingException : ConflictException
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
    public InvalidAppointmentTimeException()
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
    public TooShortNoticeException()
        : base(
            AppointmentErrorCodes.TooShortNotice,
            "Insufficient Notice",
            "This appointment requires more advance notice."
        ) { }
}

public sealed class InvalidRescheduleException : ValidationException
{
    public InvalidRescheduleException()
        : base(
            AppointmentErrorCodes.InvalidReschedule,
            "Cannot Reschedule",
            "This appointment cannot be rescheduled."
        ) { }
}

public sealed class DoctorNotAvailableException : ValidationException
{
    public DoctorNotAvailableException()
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
