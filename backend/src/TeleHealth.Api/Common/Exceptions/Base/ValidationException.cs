namespace TeleHealth.Api.Common.Exceptions.Base;

public abstract class ValidationException : ProblemException
{
    protected ValidationException(
        string errorCode,
        string title,
        string message,
        string? detail = null
    )
        : base(errorCode, StatusCodes.Status400BadRequest, title, message, detail) { }
}
