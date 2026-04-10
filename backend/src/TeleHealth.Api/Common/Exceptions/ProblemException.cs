namespace TeleHealth.Api.Common.Exceptions;

public abstract class ProblemException : Exception
{
    public int StatusCode { get; }
    public string ErrorCode { get; }
    public string Title { get; }
    public string? Detail { get; }

    protected ProblemException(
        string errorCode,
        int statusCode,
        string title,
        string message,
        string? detail = null
    )
        : base(message)
    {
        ErrorCode = errorCode;
        StatusCode = statusCode;
        Title = title;
        Detail = detail;
    }
}
