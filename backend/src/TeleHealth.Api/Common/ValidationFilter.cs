using FluentValidation;

namespace TeleHealth.Api.Common;

public class ValidationFilter<T> : IEndpointFilter
    where T : class
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next
    )
    {
        // 1. Find the validator from the DI container
        var validator = context.HttpContext.RequestServices.GetService<IValidator<T>>();

        if (validator is not null)
        {
            // 2. Find the Command payload in the incoming request
            var entity = context.Arguments.OfType<T>().FirstOrDefault();

            if (entity is not null)
            {
                // 3. Run FluentValidation
                var validationResult = await validator.ValidateAsync(entity);

                if (!validationResult.IsValid)
                {
                    // 4. If it fails, instantly return a 400 Bad Request with standardized JSON errors
                    return Results.ValidationProblem(validationResult.ToDictionary());
                }
            }
        }

        // 5. If valid, let the request proceed to your Handler
        return await next(context);
    }
}
