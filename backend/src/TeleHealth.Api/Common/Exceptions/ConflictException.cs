namespace TeleHealth.Api.Common.Exceptions;

public sealed class ConflictException : ProblemException
{
    // Legacy constructor for backward compatibility
    public ConflictException(string message)
        : base("Conflict", StatusCodes.Status409Conflict, "Conflict", message) { }

    // New constructor with semantic error code
    public ConflictException(string errorCode, string title, string message, string? detail = null)
        : base(errorCode, StatusCodes.Status409Conflict, title, message, detail) { }
}
