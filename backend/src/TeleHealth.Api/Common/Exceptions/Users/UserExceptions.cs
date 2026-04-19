using Serilog;

using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.Users;

public sealed class UserNotFoundException : NotFoundException
{
    public UserNotFoundException(Guid userId)
        : base(UserErrorCodes.NotFound, "User Not Found", "The requested user could not be found.")
    {
        Log.Warning("User not found. UserId: {UserId}", userId);
    }
}

public sealed class UserProfileNotFoundException : NotFoundException
{
    public UserProfileNotFoundException(Guid userId)
        : base(
            UserErrorCodes.ProfileNotFound,
            "User Profile Not Found",
            "The requested user profile could not be found."
        )
    {
        Log.Warning("User profile not found. UserId: {UserId}", userId);
    }
}

public sealed class DuplicateUsernameException : ConflictException
{
    public DuplicateUsernameException()
        : base(
            UserErrorCodes.DuplicateUsername,
            "Username Already Taken",
            "The chosen username is already in use."
        )
    { }
}

public sealed class DuplicateEmailException : ConflictException
{
    public DuplicateEmailException()
        : base(
            UserErrorCodes.DuplicateEmail,
            "Email Already Registered",
            "An account with this email address already exists."
        )
    { }
}

public sealed class DuplicateIcNumberException : ConflictException
{
    public DuplicateIcNumberException()
        : base(
            UserErrorCodes.DuplicateIcNumber,
            "IC Number Already Registered",
            "An account with this IC number already exists."
        )
    { }
}

public sealed class UserAlreadyExistsException : ConflictException
{
    public UserAlreadyExistsException()
        : base(
            UserErrorCodes.AlreadyExists,
            "User Already Exists",
            "A user with these details already exists."
        )
    { }
}

public sealed class InvalidUserDataException : ValidationException
{
    public InvalidUserDataException(string field, string reason)
        : base(UserErrorCodes.InvalidData, "Invalid User Data", "The value provided is invalid.")
    {
        Log.Debug("Invalid user data. Field: {Field}, Reason: {Reason}", field, reason);
    }
}

public sealed class WeakPasswordException : ValidationException
{
    public WeakPasswordException()
        : base(
            UserErrorCodes.WeakPassword,
            "Weak Password",
            "The provided password does not meet security requirements."
        )
    { }
}

public sealed class InvalidEmailFormatException : ValidationException
{
    public InvalidEmailFormatException()
        : base(
            UserErrorCodes.InvalidEmailFormat,
            "Invalid Email Format",
            "The provided email address format is invalid."
        )
    { }
}