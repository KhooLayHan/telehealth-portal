namespace TeleHealth.Api.Common.Extensions;

public static class CorsExtensions
{
    public static IServiceCollection AddCorsConfiguration(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        var allowedOriginsString = configuration["Cors:AllowedOrigins"];

        // 2. Fallback for local development if the env var isn't set
        if (string.IsNullOrWhiteSpace(allowedOriginsString))
        {
            allowedOriginsString = "http://localhost:5173,http://localhost:5174";
        }

        // 3. Split it safely into an array
        var allowedOrigins = allowedOriginsString.Split(
            ',',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries
        );

        services.AddCors(options =>
        {
            options.AddPolicy(
                "AllowFrontend",
                policy =>
                {
                    policy
                        .WithOrigins(allowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                }
            );
        });

        return services;
    }
}
