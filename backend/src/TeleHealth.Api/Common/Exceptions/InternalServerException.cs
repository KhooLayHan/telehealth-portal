namespace TeleHealth.Api.Common.Exceptions;

public sealed class InternalServerException : ProblemException
{
    public InternalServerException(string message)
        : base(
            "InternalServerError",
            StatusCodes.Status500InternalServerError,
            "Internal Server Error",
            message
        )
    { }

    public InternalServerException(string errorCode, string title, string message)
        : base(errorCode, StatusCodes.Status500InternalServerError, title, message) { }
}