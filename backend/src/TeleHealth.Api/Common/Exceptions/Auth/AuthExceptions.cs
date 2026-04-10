using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.Auth;

public sealed class InvalidCredentialsException : UnauthorizedException
{
    public InvalidCredentialsException()
        : base(
            AuthErrorCodes.InvalidCredentials,
            "Invalid Credentials",
            "The provided credentials are invalid."
        ) { }
}

public sealed class TokenExpiredException : UnauthorizedException
{
    public TokenExpiredException()
        : base(
            AuthErrorCodes.TokenExpired,
            "Token Expired",
            "Your session has expired. Please log in again."
        ) { }
}

public sealed class TokenInvalidException : UnauthorizedException
{
    public TokenInvalidException(string? reason = null)
        : base(
            AuthErrorCodes.TokenInvalid,
            "Invalid Token",
            "The provided authentication token is invalid."
        ) { }
}

public sealed class RefreshTokenRevokedException : UnauthorizedException
{
    public RefreshTokenRevokedException()
        : base(
            AuthErrorCodes.RefreshTokenRevoked,
            "Session Revoked",
            "Your session has been revoked. Please log in again."
        ) { }
}

public sealed class SessionExpiredException : UnauthorizedException
{
    public SessionExpiredException()
        : base(
            AuthErrorCodes.SessionExpired,
            "Session Expired",
            "Your session has expired due to inactivity."
        ) { }
}

public sealed class InsufficientPermissionsException : ForbiddenException
{
    public InsufficientPermissionsException(string requiredRole)
        : base(
            AuthErrorCodes.InsufficientPermissions,
            "Insufficient Permissions",
            "You do not have permission to perform this action."
        ) { }
}

public sealed class ResourceAccessDeniedException : ForbiddenException
{
    public ResourceAccessDeniedException(string resource, string resourceId)
        : base(
            AuthErrorCodes.ResourceAccessDenied,
            "Access Denied",
            "You do not have access to this resource."
        ) { }
}

public sealed class ActionNotAllowedException : ForbiddenException
{
    public ActionNotAllowedException(string action, string reason)
        : base(
            AuthErrorCodes.ActionNotAllowed,
            "Action Not Allowed",
            $"The action '{action}' cannot be performed."
        ) { }
}
