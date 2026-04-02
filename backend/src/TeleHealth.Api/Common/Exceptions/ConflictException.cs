namespace TeleHealth.Api.Common.Exceptions;

public sealed class ConflictException : ProblemException
{
    public ConflictException(string message)
        : base(message, StatusCodes.Status409Conflict) { }
}
