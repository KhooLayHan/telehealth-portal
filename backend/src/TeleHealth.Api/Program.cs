using Microsoft.EntityFrameworkCore;

using OpenTelemetry.Logs;
using OpenTelemetry.Resources;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

using Scalar.AspNetCore;

using Serilog;
using Serilog.Sinks.OpenTelemetry;

using TeleHealth.Api;
using TeleHealth.Api.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, config) => config.ReadFrom.Configuration(context.Configuration));

Log.Logger = new LoggerConfiguration()
    .WriteTo.OpenTelemetry(x =>
    {
        x.Endpoint = "http://telehealth_seq:5341/ingest/otlp/v1/logs";
        x.Protocol = OtlpProtocol.HttpProtobuf;
        x.Headers.Add("X-Seq-ApiKey", "DOjvrcXB9RfyEGDwyKX2");
        x.ResourceAttributes.Add("service.name", "TeleHealth.Api");
    })
    .CreateLogger();

builder.Services.AddSerilog();

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService("TeleHealth.Api"))
    .WithMetrics(metrics =>
    {
        metrics.AddAspNetCoreInstrumentation().AddAWSInstrumentation().AddHttpClientInstrumentation();
    }).WithTracing(tracing =>
    {
        tracing.AddAspNetCoreInstrumentation().AddAWSInstrumentation().AddHttpClientInstrumentation();
    });

builder.Logging.AddOpenTelemetry(logging => logging.AddOtlpExporter());

builder.Services.AddOpenApi();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options
        .UseNpgsql(
            builder.Configuration.GetConnectionString("Database"),
            o => o.SetPostgresVersion(18, 0).UseNodaTime()
        )
        .UseSnakeCaseNamingConvention()
);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options
            .WithTitle("TeleHealth API")
            .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
    });

    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync();
}

app.UseHttpsRedirection();

app.UseSerilogRequestLogging();

await app.RunAsync();
