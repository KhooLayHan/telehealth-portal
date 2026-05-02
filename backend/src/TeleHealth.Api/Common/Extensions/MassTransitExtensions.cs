using MassTransit;
using NodaTime;
using NodaTime.Serialization.SystemTextJson;
using TeleHealth.Api.Infrastructure.Persistence;
using TeleHealth.Contracts;

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

            // Prod
            x.UsingAmazonSqs(
                (ctx, cfg) =>
                {
                    cfg.Host(
                        configuration["Aws:Region"]!,
                        h =>
                        {
                            h.AccessKey(configuration["Aws:AccessKey"]!);
                            h.SecretKey(configuration["Aws:SecretKey"]!);
                        }
                    );

                    cfg.ConfigureJsonSerializerOptions(options =>
                        options.ConfigureForNodaTime(DateTimeZoneProviders.Tzdb)
                    );

                    cfg.Message<LabReportCompletedEvent>(m =>
                        m.SetEntityName("medical-alerts-topic")
                    );
                    cfg.ConfigureEndpoints(ctx);
                }
            );
        });

        return services;
    }
}
