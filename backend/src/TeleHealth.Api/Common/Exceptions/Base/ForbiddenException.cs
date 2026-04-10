namespace TeleHealth.Api.Common.Exceptions.Base;

public abstract class ForbiddenException : ProblemException
{
    protected ForbiddenException(
        string errorCode,
        string title,
        string message,
        string? detail = null
    )
        : base(errorCode, StatusCodes.Status403Forbidden, title, message, detail) { }
}
