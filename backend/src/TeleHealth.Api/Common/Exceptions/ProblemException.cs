namespace TeleHealth.Api.Common.Exceptions;

public abstract class ProblemException(
    string errorCode,
    int statusCode,
    string title,
    string message
) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public string ErrorCode { get; } = errorCode;
    public string Title { get; } = title;
}