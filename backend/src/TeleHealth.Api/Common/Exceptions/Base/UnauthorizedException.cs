namespace TeleHealth.Api.Common.Exceptions.Base;

public abstract class UnauthorizedException : ProblemException
{
    protected UnauthorizedException(
        string errorCode,
        string title,
        string message,
        string? detail = null
    )
        : base(errorCode, StatusCodes.Status401Unauthorized, title, message, detail) { }
}
