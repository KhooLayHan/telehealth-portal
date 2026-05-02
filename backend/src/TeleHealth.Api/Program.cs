using Scalar.AspNetCore;
using Serilog;
using TeleHealth.Api.Common.Extensions;

Log.Information("Starting TeleHealth API Boot Sequence...");

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, config) => config.ReadFrom.Configuration(context.Configuration));

builder
    .Services.AddProblemDetailsExceptionHandling()
    .AddOpenTelemetryConfiguration()
    .AddOpenApiConfiguration()
    .AddDatabaseConfiguration(builder.Configuration, builder.Environment)
    .AddJwtAuthentication(builder.Configuration)
    .AddAuthorizationPolicies()
    .AddCorsConfiguration(builder.Configuration)
    .AddMassTransitConfiguration(builder.Configuration, builder.Environment)
    .AddApiVersioningConfiguration()
    .AddApplicationServices(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
        options
            .WithTitle("TeleHealth API")
            .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
    );

    await app.MigrateAsync();
}

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.UseSerilogRequestLogging();
app.UseExceptionHandler();
app.UseStatusCodePages();

app.UseAuthentication();
app.UseAuthorization();

var api = app.CreateVersionedApiGroup();
api.MapAllEndpoints();

Log.Information("TeleHealth API successfully started.");

await app.RunAsync();
