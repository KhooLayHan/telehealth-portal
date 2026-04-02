namespace TeleHealth.Api.Common.Exceptions;

public abstract class ProblemException : Exception
{
    public int StatusCode { get; }
    public string ErrorCode { get; }
    public string Title { get; }

    protected ProblemException(
        string message,
        int statusCode,
        string title,
        string? errorCode = null
    )
        : base(message)
    {
        StatusCode = statusCode;
        Title = title;
        ErrorCode = errorCode ?? GetType().Name;
    }
}
