namespace TeleHealth.Api.Common.Exceptions.Base;

public abstract class ConflictException(string errorCode, string title, string message)
    : ProblemException(errorCode, StatusCodes.Status409Conflict, title, message);
