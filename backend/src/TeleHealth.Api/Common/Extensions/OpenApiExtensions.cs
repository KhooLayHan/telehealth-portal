using NodaTime;
using NodaTime.Serialization.SystemTextJson;

namespace TeleHealth.Api.Common.Extensions;

public static class OpenApiExtensions
{
    public static IServiceCollection AddOpenApiConfiguration(this IServiceCollection services)
    {
        services.AddOpenApi(options =>
        {
            options.AddSchemaTransformer(
                (schema, context, cancellationToken) =>
                {
                    if (context.JsonTypeInfo.Type == typeof(LocalDate))
                    {
                        schema.Type = Microsoft.OpenApi.JsonSchemaType.String;
                        schema.Format = "date";
                    }

                    if (context.JsonTypeInfo.Type == typeof(Instant))
                    {
                        schema.Type = Microsoft.OpenApi.JsonSchemaType.String;
                        schema.Format = "date-time";
                    }

                    if (context.JsonTypeInfo.Type == typeof(LocalTime))
                    {
                        schema.Type = Microsoft.OpenApi.JsonSchemaType.String;
                        schema.Format = "time";
                    }

                    return Task.CompletedTask;
                }
            );
        });

        services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.ConfigureForNodaTime(DateTimeZoneProviders.Tzdb);
        });

        return services;
    }
}
