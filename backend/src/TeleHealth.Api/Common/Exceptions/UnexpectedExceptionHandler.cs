using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;

namespace TeleHealth.Api.Common.Exceptions;

internal sealed class UnexpectedExceptionHandler(IProblemDetailsService problemDetailsService)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken
    )
    {
        if (exception is ProblemException)
        {
            return false;
        }

        if (exception is BadHttpRequestException badRequestException)
        {
            httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;

            var isDevelopment = httpContext
                .RequestServices.GetRequiredService<IHostEnvironment>()
                .IsDevelopment();

            var badRequestDetails = new ProblemDetails
            {
                Title = "Bad Request",
                Type = "BadRequest",
                Detail = isDevelopment
                    ? badRequestException.Message
                    : "The request is malformed or invalid.",
                Status = StatusCodes.Status400BadRequest,
            };

            return await problemDetailsService.TryWriteAsync(
                new ProblemDetailsContext
                {
                    HttpContext = httpContext,
                    ProblemDetails = badRequestDetails,
                    Exception = exception,
                }
            );
        }

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;

        var problemDetails = new ProblemDetails
        {
            Title = ReasonPhrases.GetReasonPhrase(StatusCodes.Status500InternalServerError),
            Type = "InternalError",
            Detail = "An unexpected error occurred.",
            Status = StatusCodes.Status500InternalServerError,
        };

        return await problemDetailsService.TryWriteAsync(
            new ProblemDetailsContext
            {
                HttpContext = httpContext,
                ProblemDetails = problemDetails,
                Exception = exception,
            }
        );
    }
}
