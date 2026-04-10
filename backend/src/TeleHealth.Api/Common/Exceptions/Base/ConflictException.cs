namespace TeleHealth.Api.Common.Exceptions.Base;

public abstract class ConflictException : ProblemException
{
    protected ConflictException(
        string errorCode,
        string title,
        string message,
        string? detail = null
    )
        : base(errorCode, StatusCodes.Status409Conflict, title, message, detail) { }
}
