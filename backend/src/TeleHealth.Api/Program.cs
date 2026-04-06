using Amazon.S3;

using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;
using Scalar.AspNetCore;
using Serilog;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Extensions;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Features.Patients.GetProfile;
using TeleHealth.Api.Features.Patients.UpdateMedicalRecord;
using TeleHealth.Api.Features.Users.Create;
using TeleHealth.Api.Features.Users.Login;
using TeleHealth.Api.Features.Users.Register;
using TeleHealth.Api.Infrastructure.Aws;
using TeleHealth.Api.Infrastructure.Persistence;

Log.Information("Starting TeleHealth API Boot Sequence...");

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, config) => config.ReadFrom.Configuration(context.Configuration));

builder.Services.AddProblemDetailsExceptionHandling();

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

builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddAuthorizationPolicies();
builder.Services.AddCorsConfiguration(builder.Configuration);
builder.Services.AddMassTransitConfiguration(builder.Configuration, builder.Environment);
builder.Services.AddApiVersioningConfiguration();

builder.Services.AddValidatorsFromAssemblyContaining<Program>();

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<ITokenService, TokenService>();

builder.Services.AddScoped<LoginHandler>();
builder.Services.AddScoped<RegisterPatientHandler>();
builder.Services.AddScoped<CreateUserHandler>();
builder.Services.AddScoped<GetProfileHandler>();
builder.Services.AddScoped<UpdateMedicalRecordHandler>();

services.AddDefaultAWSOptions(builder.Configuration.GetAWSOptions());
services.AddAWSService<IAmazonS3>();
builder.Services.AddScoped<IS3Service, S3Service>();

builder.Services.AddHttpContextAccessor();

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

app.UseCors("AllowFrontend");

app.UseExceptionHandler();
app.UseStatusCodePages();

app.UseAuthentication();
app.UseAuthorization();

var api = app.CreateVersionedApiGroup();
api.MapLoginEndpoint();
api.MapRegisterPatientEndpoint();
api.MapCreateUserEndpoint();
api.MapGetProfileEndpoint();
api.MapUpdateMedicalRecordEndpoint();

app.UseHttpsRedirection();

app.UseSerilogRequestLogging();

Log.Information("TeleHealth API successfully started.");

await app.RunAsync();
