using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
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
    .AddApplicationServices(builder.Configuration)
    .AddHealthChecks()
    .AddNpgSql();

var s3BucketName =
    builder.Configuration["AWS_S3_LAB_REPORTS_BUCKET"]
    ?? builder.Configuration["Aws:S3:BucketName"];
if (!string.IsNullOrEmpty(s3BucketName))
{
    builder
        .Services.AddHealthChecks()
        .AddS3(setup => setup.BucketName = s3BucketName, name: "aws-s3");
}

var sqsQueueUrl =
    builder.Configuration["AWS_SQS_QUEUE_URL"]
    ?? builder.Configuration["Aws:Sqs:LabProcessorQueueUrl"];
if (!string.IsNullOrEmpty(sqsQueueUrl))
{
    var segments = sqsQueueUrl.TrimEnd('/').Split('/');
    var queueName = segments[segments.Length - 1];
    builder.Services.AddHealthChecks().AddSqs(setup => setup.AddQueue(queueName), name: "aws-sqs");
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
        options
            .WithTitle("TeleHealth API")
            .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
    );
}

// Run EF Core migrations on startup for all environments so that
// production databases are kept in sync with the codebase schema.
await app.MigrateAsync();

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.UseSerilogRequestLogging();
app.UseExceptionHandler();
app.UseStatusCodePages();

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks(
    "/health",
    new HealthCheckOptions { ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse }
);

var api = app.CreateVersionedApiGroup();
api.MapAllEndpoints();

Log.Information("TeleHealth API successfully started.");

await app.RunAsync();
