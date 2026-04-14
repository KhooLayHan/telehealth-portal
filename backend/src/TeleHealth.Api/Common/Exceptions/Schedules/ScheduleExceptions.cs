using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.Schedules;

// Validation Exceptions (400)
public sealed class InvalidateDateException : ValidationException
{
    public InvalidateDateException()
        : base(
            ScheduleErrorCodes.InvalidDate,
            "Schedule Invalid Date",
            "The value provided is invalid."
        ) { }
}

public sealed class InvalidScheduleTimeException : ValidationException
{
    public InvalidScheduleTimeException()
        : base(
            ScheduleErrorCodes.InvalidTime,
            "Invalid Schedule Time",
            "The schedule time is invalid."
        ) { }
}

public sealed class InvalidScheduleTimeRangeException : ValidationException
{
    public InvalidScheduleTimeRangeException()
        : base(
            ScheduleErrorCodes.InvalidTimeRange,
            "Invalid Time Range",
            "The end time must be after the start time."
        ) { }
}

public sealed class PastScheduleException : ValidationException
{
    public PastScheduleException()
        : base(
            ScheduleErrorCodes.PastSchedule,
            "Past Schedule",
            "Cannot create schedules for past dates."
        ) { }
}

public sealed class ScheduleDoctorRequiredException : ValidationException
{
    public ScheduleDoctorRequiredException()
        : base(
            ScheduleErrorCodes.DoctorRequired,
            "Doctor Required",
            "A doctor is required to create a schedule."
        ) { }
}

public sealed class InvalidScheduleStatusTransitionException : ValidationException
{
    public InvalidScheduleStatusTransitionException()
        : base(
            ScheduleErrorCodes.InvalidStatusTransition,
            "Invalid Status Transition",
            "This status transition is not allowed."
        ) { }
}

// Not Found Exceptions (404)
public sealed class ScheduleNotFoundException : NotFoundException
{
    public ScheduleNotFoundException()
        : base(
            ScheduleErrorCodes.NotFound,
            "Schedule Not Found",
            "The requested schedule could not be found."
        ) { }
}

public sealed class ScheduleDoctorNotFoundException : NotFoundException
{
    public ScheduleDoctorNotFoundException()
        : base(
            ScheduleErrorCodes.DoctorNotFound,
            "Doctor Not Found",
            "The specified doctor could not be found."
        ) { }
}

// Conflict Exceptions (409)
public sealed class NoAvailableScheduleSlotsException : ConflictException
{
    public NoAvailableScheduleSlotsException()
        : base(
            ScheduleErrorCodes.NoAvailableSlots,
            "No Available Slots",
            "No available schedule slots found for the specified criteria."
        ) { }
}

public sealed class ScheduleAlreadyBookedException : ConflictException
{
    public ScheduleAlreadyBookedException()
        : base(
            ScheduleErrorCodes.AlreadyBooked,
            "Schedule Already Booked",
            "This schedule slot is already booked."
        ) { }
}

public sealed class ScheduleAlreadyBlockedException : ConflictException
{
    public ScheduleAlreadyBlockedException()
        : base(
            ScheduleErrorCodes.AlreadyBlocked,
            "Schedule Already Blocked",
            "This schedule slot is already blocked."
        ) { }
}

public sealed class OverlappingScheduleSlotException : ConflictException
{
    public OverlappingScheduleSlotException()
        : base(
            ScheduleErrorCodes.SlotOverlap,
            "Overlapping Schedule",
            "This schedule overlaps with an existing schedule for this doctor."
        ) { }
}

public sealed class OutsideWorkingHoursException : ConflictException
{
    public OutsideWorkingHoursException()
        : base(
            ScheduleErrorCodes.OutsideWorkingHours,
            "Outside Working Hours",
            "The schedule falls outside working hours."
        ) { }
}

public sealed class ScheduleConcurrentModificationException : ConflictException
{
    public ScheduleConcurrentModificationException()
        : base(
            ScheduleErrorCodes.ConcurrentModification,
            "Concurrent Modification",
            "This schedule has been modified by another user. Please refresh and try again."
        ) { }
}

// Forbidden Exceptions (403)
public sealed class CannotModifyBookedScheduleException : ForbiddenException
{
    public CannotModifyBookedScheduleException()
        : base(
            ScheduleErrorCodes.CannotModifyBooked,
            "Cannot Modify Booked Schedule",
            "Booked schedules cannot be modified. Cancel the appointment first."
        ) { }
}

public sealed class CannotModifyBlockedScheduleException : ForbiddenException
{
    public CannotModifyBlockedScheduleException()
        : base(
            ScheduleErrorCodes.CannotModifyBlocked,
            "Cannot Modify Blocked Schedule",
            "Blocked schedules require admin privileges to modify."
        ) { }
}
