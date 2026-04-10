using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.Users;

public sealed class UserNotFoundException : NotFoundException
{
    public UserNotFoundException(string identifier)
        : base(UserErrorCodes.NotFound, "User Not Found", $"User '{identifier}' was not found.") { }
}

public sealed class UserProfileNotFoundException : NotFoundException
{
    public UserProfileNotFoundException(string userId)
        : base(
            UserErrorCodes.ProfileNotFound,
            "User Profile Not Found",
            $"User profile not found for user: {userId}"
        ) { }
}

public sealed class DuplicateUsernameException : Base.ConflictException
{
    public DuplicateUsernameException(string username)
        : base(
            UserErrorCodes.DuplicateUsername,
            "Username Already Taken",
            $"Username '{username}' is already registered."
        ) { }
}

public sealed class DuplicateEmailException : Base.ConflictException
{
    public DuplicateEmailException(string email)
        : base(
            UserErrorCodes.DuplicateEmail,
            "Email Already Registered",
            $"Email '{email}' is already registered."
        ) { }
}

public sealed class DuplicateIcNumberException : Base.ConflictException
{
    public DuplicateIcNumberException(string icNumber)
        : base(
            UserErrorCodes.DuplicateIcNumber,
            "IC Number Already Registered",
            $"IC Number '{icNumber}' is already registered."
        ) { }
}

public sealed class UserAlreadyExistsException : Base.ConflictException
{
    public UserAlreadyExistsException()
        : base(
            UserErrorCodes.AlreadyExists,
            "User Already Exists",
            "A user with these details already exists."
        ) { }
}

public sealed class InvalidUserDataException : ValidationException
{
    public InvalidUserDataException(string field, string reason)
        : base(
            UserErrorCodes.InvalidData,
            "Invalid User Data",
            $"Invalid data provided for field '{field}': {reason}"
        ) { }
}

public sealed class WeakPasswordException : ValidationException
{
    public WeakPasswordException(string reason)
        : base(
            UserErrorCodes.WeakPassword,
            "Weak Password",
            "The provided password does not meet security requirements."
        ) { }
}

public sealed class InvalidEmailFormatException : ValidationException
{
    public InvalidEmailFormatException(string email)
        : base(
            UserErrorCodes.InvalidEmailFormat,
            "Invalid Email Format",
            "The provided email address format is invalid."
        ) { }
}
