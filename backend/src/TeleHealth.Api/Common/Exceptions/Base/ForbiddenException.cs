namespace TeleHealth.Api.Common.Exceptions.Base;

public abstract class ForbiddenException : ProblemException
{
    protected ForbiddenException(string errorCode, string title, string message)
        : base(errorCode, StatusCodes.Status403Forbidden, title, message) { }
}
