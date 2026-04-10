namespace TeleHealth.Api.Common.Exceptions.ErrorCodes;

public static class AuthErrorCodes
{
    public const string InvalidCredentials = "Auth.InvalidCredentials";
    public const string TokenExpired = "Auth.TokenExpired";
    public const string TokenInvalid = "Auth.TokenInvalid";
    public const string RefreshTokenRevoked = "Auth.RefreshTokenRevoked";
    public const string SessionExpired = "Auth.SessionExpired";
    public const string InsufficientPermissions = "Auth.InsufficientPermissions";
    public const string ResourceAccessDenied = "Auth.ResourceAccessDenied";
    public const string ActionNotAllowed = "Auth.ActionNotAllowed";
}
