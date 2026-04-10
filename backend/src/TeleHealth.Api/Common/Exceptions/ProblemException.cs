namespace TeleHealth.Api.Common.Exceptions;

public abstract class ProblemException : Exception
{
    public int StatusCode { get; }
    public string ErrorCode { get; }
    public string Title { get; }

    protected ProblemException(string errorCode, int statusCode, string title, string message)
        : base(message)
    {
        ErrorCode = errorCode;
        StatusCode = statusCode;
        Title = title;
    }
}
