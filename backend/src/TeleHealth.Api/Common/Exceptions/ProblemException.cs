namespace TeleHealth.Api.Common.Exceptions;

public abstract class ProblemException : Exception
{
    public int StatusCode { get; }
    public string ErrorCode { get; }

    protected ProblemException(string message, int statusCode, string? errorCode = null)
        : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode ?? GetType().Name;
    }
}
