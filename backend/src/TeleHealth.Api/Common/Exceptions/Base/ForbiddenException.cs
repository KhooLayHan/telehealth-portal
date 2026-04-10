namespace TeleHealth.Api.Common.Exceptions.Base;

public abstract class ForbiddenException(string errorCode, string title, string message)
    : ProblemException(errorCode, StatusCodes.Status403Forbidden, title, message);
