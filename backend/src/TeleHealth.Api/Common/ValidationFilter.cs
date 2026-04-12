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
        var validator = context.HttpContext.RequestServices.GetService<IValidator<T>>();

        if (validator is null)
        {
            return await next(context);
        }

        var entity = context.Arguments.OfType<T>().FirstOrDefault();

        if (entity is null)
        {
            return await next(context);
        }

        var validationResult = await validator.ValidateAsync(entity);

        return !validationResult.IsValid
            ? Results.Problem(
                statusCode: StatusCodes.Status422UnprocessableEntity,
                title: "Validation failed.",
                extensions: new Dictionary<string, object?>
                {
                    ["errors"] = validationResult.ToDictionary(),
                }
            )
            : await next(context);
    }
}
