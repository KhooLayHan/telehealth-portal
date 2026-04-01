using MassTransit;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Common.Extensions;

public static class MassTransitExtensions
{
    public static IServiceCollection AddMassTransitConfiguration(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment
    )
    {
        services.AddMassTransit(x =>
        {
            x.AddEntityFrameworkOutbox<ApplicationDbContext>(o =>
            {
                o.UsePostgres();
                o.UseBusOutbox();
                o.QueryDelay = TimeSpan.FromSeconds(1);
            });

            // Dev
            if (environment.IsDevelopment())
            {
                x.UsingAmazonSqs(
                    (ctx, cfg) =>
                    {
                        cfg.LocalstackHost();
                        cfg.ConfigureEndpoints(ctx);
                    }
                );
            }
            else
            {
                // Prod
                x.UsingAmazonSqs(
                    (ctx, cfg) =>
                    {
                        cfg.Host(
                            configuration["Aws:Region"]!,
                            h =>
                            {
                                h.AccessKey(configuration["AWS:AccessKey"]!);
                                h.SecretKey(configuration["AWS:SecretKey"]!);
                            }
                        );
                        cfg.ConfigureEndpoints(ctx);
                    }
                );
            }
        });

        return services;
    }
}
