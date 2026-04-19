namespace TeleHealth.Api.Common.Exceptions.Base;

public abstract class NotFoundException(string errorCode, string title, string message)
    : ProblemException(errorCode, StatusCodes.Status404NotFound, title, message);