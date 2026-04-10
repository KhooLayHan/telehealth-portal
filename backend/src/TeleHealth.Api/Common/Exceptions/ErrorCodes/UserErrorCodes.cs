namespace TeleHealth.Api.Common.Exceptions.ErrorCodes;

public static class UserErrorCodes
{
    public const string NotFound = "User.NotFound";
    public const string ProfileNotFound = "User.ProfileNotFound";
    public const string DuplicateUsername = "User.DuplicateUsername";
    public const string DuplicateEmail = "User.DuplicateEmail";
    public const string DuplicateIcNumber = "User.DuplicateIcNumber";
    public const string AlreadyExists = "User.AlreadyExists";
    public const string InvalidData = "User.InvalidData";
    public const string WeakPassword = "User.WeakPassword";
    public const string InvalidEmailFormat = "User.InvalidEmailFormat";
    public const string InvalidCredentials = "User.InvalidCredentials";
    public const string AccountLocked = "User.AccountLocked";
    public const string AccountNotActivated = "User.AccountNotActivated";
}
