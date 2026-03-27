using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;
using Scalar.AspNetCore;
using Serilog;
using TeleHealth.Api.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, config) => config.ReadFrom.Configuration(context.Configuration));

builder
    .Services.AddOpenTelemetry()
    .WithMetrics(metrics =>
        metrics
            .AddAspNetCoreInstrumentation()
            .AddAWSInstrumentation()
            .AddHttpClientInstrumentation()
            .AddOtlpExporter()
    )
    .WithTracing(tracing =>
        tracing
            .AddAspNetCoreInstrumentation()
            .AddAWSInstrumentation()
            .AddHttpClientInstrumentation()
            .AddOtlpExporter()
    );

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
        options
            .WithTitle("TeleHealth API")
            .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
    );

    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync();
}

app.UseHttpsRedirection();

app.UseSerilogRequestLogging();

Log.Information("Starting TeleHealth API Boot Sequence...");

await app.RunAsync();
