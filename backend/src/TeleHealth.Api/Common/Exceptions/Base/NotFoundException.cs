namespace TeleHealth.Api.Common.Exceptions.Base;

public abstract class NotFoundException : ProblemException
{
    protected NotFoundException(
        string errorCode,
        string title,
        string message,
        string? detail = null
    )
        : base(errorCode, StatusCodes.Status404NotFound, title, message, detail) { }
}
