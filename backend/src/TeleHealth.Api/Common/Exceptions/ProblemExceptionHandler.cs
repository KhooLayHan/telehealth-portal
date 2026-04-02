using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace TeleHealth.Api.Common.Exceptions;

internal sealed class ProblemExceptionHandler(IProblemDetailsService problemDetailsService)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken
    )
    {
        if (exception is not ProblemException problemException)
        {
            return false;
        }

        httpContext.Response.StatusCode = problemException.StatusCode;

        var isDevelopment = httpContext
            .RequestServices.GetRequiredService<IHostEnvironment>()
            .IsDevelopment();

        var problemDetails = new ProblemDetails
        {
            Title = problemException.Title,
            Type = problemException.ErrorCode,
            Status = problemException.StatusCode,
            Detail = isDevelopment ? problemException.Message : "An unexpected error occurred.",
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
