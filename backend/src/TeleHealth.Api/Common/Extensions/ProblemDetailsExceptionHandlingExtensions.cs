using Microsoft.AspNetCore.Http.Features;

using TeleHealth.Api.Common.Exceptions;

namespace TeleHealth.Api.Common.Extensions;

public static class ProblemDetailsExceptionHandlingExtensions
{
    public static IServiceCollection AddProblemDetailsExceptionHandling(
        this IServiceCollection services
    )
    {
        services.AddProblemDetails(options =>
        {
            options.CustomizeProblemDetails = context =>
            {
                context.ProblemDetails.Instance =
                    $"{context.HttpContext.Request.Method} {context.HttpContext.Request.Path}";
                context.ProblemDetails.Extensions.TryAdd(
                    "requestId",
                    context.HttpContext.TraceIdentifier
                );

                var activity = context.HttpContext.Features.Get<IHttpActivityFeature>()?.Activity;
                context.ProblemDetails.Extensions.TryAdd("traceId", activity?.TraceId.ToString());
            };
        });

        services.AddExceptionHandler<ProblemExceptionHandler>();
        services.AddExceptionHandler<UnexpectedExceptionHandler>();

        return services;
    }
}