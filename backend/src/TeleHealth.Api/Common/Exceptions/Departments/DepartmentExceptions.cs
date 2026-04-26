using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.Departments;

public sealed class DepartmentAlreadyExistsException : ConflictException
{
    public DepartmentAlreadyExistsException()
        : base(
            DepartmentErrorCodes.AlreadyExists,
            "Department Already Exists",
            "A department with this name already exists."
        ) { }
}

public sealed class DepartmentNotFoundException : NotFoundException
{
    public DepartmentNotFoundException()
        : base(
            DepartmentErrorCodes.NotFound,
            "Department Not Found",
            "The requested department could not be found."
        ) { }
}

// Represents a conflict when a department still has active staff assigned.
public sealed class DepartmentHasAssignedStaffException : ConflictException
{
    public DepartmentHasAssignedStaffException()
        : base(
            DepartmentErrorCodes.HasAssignedStaff,
            "Department Has Assigned Staff",
            "Departments with assigned staff cannot be deleted."
        ) { }
}
