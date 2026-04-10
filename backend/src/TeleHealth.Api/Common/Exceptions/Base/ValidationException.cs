namespace TeleHealth.Api.Common.Exceptions.Base;

public abstract class ValidationException(string errorCode, string title, string message)
    : ProblemException(errorCode, StatusCodes.Status400BadRequest, title, message);
