namespace TeleHealth.Api.Common.Exceptions.Base;

public abstract class NotFoundException : ProblemException
{
    protected NotFoundException(string errorCode, string title, string message)
        : base(errorCode, StatusCodes.Status404NotFound, title, message) { }
}
