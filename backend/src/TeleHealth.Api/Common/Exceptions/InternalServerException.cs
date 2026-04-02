namespace TeleHealth.Api.Common.Exceptions;

public sealed class InternalServerException : ProblemException
{
    public InternalServerException(string message)
        : base(message, StatusCodes.Status500InternalServerError, "Internal Server Error") { }
}
