using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.Schedules;

public sealed class InvalidateDateException : ValidationException
{
    public InvalidateDateException()
        : base(
            ScheduleErrorCodes.InvalidDate,
            "Schedule Invalid Date",
            "The value provided is invalid."
        ) { }
}
