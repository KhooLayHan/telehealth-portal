using Scalar.AspNetCore;
using Serilog;
// using TeleHealth.Api.Common.Extensions;
// using TeleHealth.Api.Infrastructure.SignalR;

// Log.Logger = new LoggerConfiguration()
//     .WriteTo.Console()
//     .CreateBootstrapLogger();

try
{
//     var builder = WebApplication.CreateBuilder(args);

//     builder.Host.UseSerilog((ctx, cfg) => cfg
//         .ReadFrom.Configuration(ctx.Configuration)
//         .Enrich.FromLogContext()
//         .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}"));

//     // ── Services ──────────────────────────────────────────────────────────────
//     builder.Services
//         .AddDatabase(builder.Configuration)
//         .AddIdentityServices(builder.Configuration)
//         .AddApplicationServices()
//         .AddAwsServices(builder.Configuration)
//         .AddSignalR()
//         .AddOpenApi()
//         .AddCors(opts => opts.AddDefaultPolicy(p =>
//             p.WithOrigins(builder.Configuration["Frontend:BaseUrl"] ?? "http://localhost:5173")
//              .AllowAnyHeader()
//              .AllowAnyMethod()
//              .AllowCredentials()));

//     // ── Endpoint registration (VSA) ───────────────────────────────────────────
//     builder.Services.AddEndpointsFromAssembly();

//     var app = builder.Build();

//     // ── Middleware pipeline ───────────────────────────────────────────────────
//     app.UseSerilogRequestLogging();
//     app.UseCors();
//     app.UseAuthentication();
//     app.UseAuthorization();

//     if (app.Environment.IsDevelopment())
//     {
//         app.MapOpenApi();
//         app.MapScalarApiReference("/api-docs");
//     }

//     // ── Hubs ──────────────────────────────────────────────────────────────────
//     app.MapHub<NotificationHub>("/hubs/notifications");

//     // ── Feature endpoints ─────────────────────────────────────────────────────
//     app.MapEndpoints();

//     app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
//     Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
//     Log.CloseAndFlush();
}
