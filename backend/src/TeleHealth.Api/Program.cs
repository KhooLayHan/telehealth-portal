using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;
using Scalar.AspNetCore;
using Serilog;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Features.Users.CreateUser;
using TeleHealth.Api.Features.Users.Login;
using TeleHealth.Api.Features.Users.Register;
using TeleHealth.Api.Infrastructure.Persistence;

Log.Information("Starting TeleHealth API Boot Sequence...");

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

builder
    .Services.AddAuthentication(x =>
    {
        x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        var secretKey = builder.Configuration["Jwt:Secret"];

        if (string.IsNullOrWhiteSpace(secretKey))
        {
            throw new InvalidOperationException("Jwt:Secret configuration is required.");
        }

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "TeleHealthApi",
            ValidAudience = "TeleHealthFrontend",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        };

        // CRITICAL FOR SPAs: Tell JWT to look for the token in the Cookie!
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                context.Token = context.Request.Cookies["X-Access-Token"];
                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddValidatorsFromAssemblyContaining<Program>();

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

builder.Services.AddScoped<LoginHandler>();
builder.Services.AddScoped<RegisterPatientHandler>();
builder.Services.AddScoped<CreateUserHandler>();
builder.Services.AddHttpContextAccessor();

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    );
});

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

app.UseAuthentication();
app.UseAuthorization();

var api = app.MapGroup("/api/v1");
api.MapLoginEndpoint();
api.MapRegisterPatientEndpoint();
api.MapCreateUserEndpoint();

app.UseHttpsRedirection();

app.UseSerilogRequestLogging();

Log.Information("TeleHealth API successfully started.");

await app.RunAsync();
