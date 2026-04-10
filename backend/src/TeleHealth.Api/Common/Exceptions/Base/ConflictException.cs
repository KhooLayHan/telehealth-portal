namespace TeleHealth.Api.Common.Exceptions.Base;

public abstract class ConflictException : ProblemException
{
    protected ConflictException(string errorCode, string title, string message)
        : base(errorCode, StatusCodes.Status409Conflict, title, message) { }
}
