using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Infrastructure.Persistence;
using TeleHealth.Api.Infrastructure.Persistence.Seeding;

namespace TeleHealth.Api.Common.Extensions;

public static class DatabaseExtensions
{
    public static IServiceCollection AddDatabaseConfiguration(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment
    )
    {
        services.AddScoped<DatabaseSeeder>();

        services.AddDbContext<ApplicationDbContext>(
            (serviceProvider, options) =>
            {
                options
                    .UseNpgsql(
                        configuration.GetConnectionString("Database"),
                        o => o.SetPostgresVersion(18, 0).UseNodaTime()
                    )
                    .UseSnakeCaseNamingConvention();

                if (
                    environment.IsDevelopment()
                    || configuration.GetValue<bool>("Seed:EnableOnStartup")
                )
                {
                    options
                        .UseSeeding(
                            (ctx, _) =>
                            {
                                var seeder = serviceProvider.GetRequiredService<DatabaseSeeder>();
                                seeder
                                    .SeedAsync((ApplicationDbContext)ctx)
                                    .GetAwaiter()
                                    .GetResult();
                            }
                        )
                        .UseAsyncSeeding(
                            async (ctx, _, ct) =>
                            {
                                var seeder = serviceProvider.GetRequiredService<DatabaseSeeder>();
                                await seeder.SeedAsync((ApplicationDbContext)ctx, ct);
                            }
                        );
                }
            }
        );

        return services;
    }

    public static async Task MigrateAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await dbContext.Database.MigrateAsync();
    }
}
