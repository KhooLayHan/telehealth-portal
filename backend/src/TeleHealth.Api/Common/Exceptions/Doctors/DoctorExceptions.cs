using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.Doctors;

public sealed class DoctorNotFoundException : NotFoundException
{
    public DoctorNotFoundException(string identifier)
        : base(
            DoctorErrorCodes.NotFound,
            "Doctor Not Found",
            $"Doctor '{identifier}' was not found.",
            $"No doctor exists with identifier: {identifier}"
        ) { }
}

public sealed class QualificationNotFoundException : NotFoundException
{
    public QualificationNotFoundException(string qualificationId)
        : base(
            DoctorErrorCodes.QualificationNotFound,
            "Qualification Not Found",
            "The requested qualification was not found.",
            $"Qualification {qualificationId} not found"
        ) { }
}

public sealed class InvalidScheduleException : ValidationException
{
    public InvalidScheduleException(string reason)
        : base(
            DoctorErrorCodes.InvalidSchedule,
            "Invalid Schedule",
            "The provided schedule is invalid.",
            reason
        ) { }
}

public sealed class OverlappingScheduleException : Base.ConflictException
{
    public OverlappingScheduleException(DateTimeOffset startTime, DateTimeOffset endTime)
        : base(
            DoctorErrorCodes.OverlappingSchedule,
            "Overlapping Schedule",
            "This schedule overlaps with an existing schedule.",
            $"Overlaps with schedule from {startTime:HH:mm} to {endTime:HH:mm}"
        ) { }
}

public sealed class DepartmentRequiredException : ValidationException
{
    public DepartmentRequiredException()
        : base(
            DoctorErrorCodes.DepartmentRequired,
            "Department Required",
            "A department is required for this operation."
        ) { }
}
