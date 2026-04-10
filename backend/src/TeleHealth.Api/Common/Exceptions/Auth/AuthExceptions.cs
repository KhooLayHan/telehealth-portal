using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.Auth;

public sealed class InvalidCredentialsException()
    : UnauthorizedException(
        AuthErrorCodes.InvalidCredentials,
        "Invalid Credentials",
        "The provided credentials are invalid."
    );

public sealed class TokenExpiredException()
    : UnauthorizedException(
        AuthErrorCodes.TokenExpired,
        "Token Expired",
        "Your session has expired. Please log in again."
    );

public sealed class TokenInvalidException()
    : UnauthorizedException(
        AuthErrorCodes.TokenInvalid,
        "Invalid Token",
        "The provided authentication token is invalid."
    );

public sealed class RefreshTokenRevokedException()
    : UnauthorizedException(
        AuthErrorCodes.RefreshTokenRevoked,
        "Session Revoked",
        "Your session has been revoked. Please log in again."
    );

public sealed class SessionExpiredException()
    : UnauthorizedException(
        AuthErrorCodes.SessionExpired,
        "Session Expired",
        "Your session has expired due to inactivity."
    );

public sealed class InsufficientPermissionsException()
    : ForbiddenException(
        AuthErrorCodes.InsufficientPermissions,
        "Insufficient Permissions",
        "You do not have permission to perform this action."
    );

public sealed class ResourceAccessDeniedException()
    : ForbiddenException(
        AuthErrorCodes.ResourceAccessDenied,
        "Access Denied",
        "You do not have access to this resource."
    );

public sealed class ActionNotAllowedException(string action)
    : ForbiddenException(
        AuthErrorCodes.ActionNotAllowed,
        "Action Not Allowed",
        $"The action '{action}' cannot be performed."
    );
