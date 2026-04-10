using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.Users;

public sealed class UserNotFoundException : NotFoundException
{
    public UserNotFoundException(string identifier)
        : base(
            UserErrorCodes.NotFound,
            "User Not Found",
            $"User '{identifier}' was not found.",
            $"No user exists with identifier: {identifier}"
        ) { }
}

public sealed class UserProfileNotFoundException : NotFoundException
{
    public UserProfileNotFoundException(string userId)
        : base(
            UserErrorCodes.ProfileNotFound,
            "User Profile Not Found",
            "The user profile was not found.",
            $"No profile found for user: {userId}"
        ) { }
}

public sealed class DuplicateUsernameException : ConflictException
{
    public DuplicateUsernameException(string username)
        : base(
            UserErrorCodes.DuplicateUsername,
            "Username Already Taken",
            "This username is already registered.",
            $"Username '{username}' is already in use"
        ) { }
}

public sealed class DuplicateEmailException : ConflictException
{
    public DuplicateEmailException(string email)
        : base(
            UserErrorCodes.DuplicateEmail,
            "Email Already Registered",
            "This email address is already registered.",
            $"Email '{email}' is already in use"
        ) { }
}

public sealed class DuplicateIcNumberException : ConflictException
{
    public DuplicateIcNumberException(string icNumber)
        : base(
            UserErrorCodes.DuplicateIcNumber,
            "IC Number Already Registered",
            "This IC number is already registered.",
            $"IC Number '{icNumber}' is already in use"
        ) { }
}

public sealed class UserAlreadyExistsException : ConflictException
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
            $"Invalid data provided for field '{field}'.",
            reason
        ) { }
}

public sealed class WeakPasswordException : ValidationException
{
    public WeakPasswordException(string reason)
        : base(
            UserErrorCodes.WeakPassword,
            "Weak Password",
            "The provided password does not meet security requirements.",
            reason
        ) { }
}

public sealed class InvalidEmailFormatException : ValidationException
{
    public InvalidEmailFormatException(string email)
        : base(
            UserErrorCodes.InvalidEmailFormat,
            "Invalid Email Format",
            "The provided email address format is invalid.",
            $"Email '{email}' is not a valid format"
        ) { }
}
