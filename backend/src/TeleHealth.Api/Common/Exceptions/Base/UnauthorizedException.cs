namespace TeleHealth.Api.Common.Exceptions.Base;

public abstract class UnauthorizedException(string errorCode, string title, string message)
    : ProblemException(errorCode, StatusCodes.Status401Unauthorized, title, message);