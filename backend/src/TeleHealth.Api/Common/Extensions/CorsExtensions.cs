namespace TeleHealth.Api.Common.Extensions;

public static class CorsExtensions
{
    public static IServiceCollection AddCorsConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins =
                    configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                   ?? throw new InvalidOperationException("Cors:AllowedOrigins configuration is required.");
        
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
