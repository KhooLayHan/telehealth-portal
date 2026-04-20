using Amazon.S3;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using NodaTime.Serialization.SystemTextJson;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;
using Scalar.AspNetCore;
using Serilog;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Extensions;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Features.Admins.GetAllReceptionists;
using TeleHealth.Api.Features.Appointments.Book;
using TeleHealth.Api.Features.Appointments.GetAllAppointments;
using TeleHealth.Api.Features.Appointments.GetAppointmentByIdForDoctor;
using TeleHealth.Api.Features.Appointments.GetAppointmentsById;
using TeleHealth.Api.Features.Appointments.GetAppointmentStatuses;
using TeleHealth.Api.Features.Appointments.SubmitConsultation;
using TeleHealth.Api.Features.Appointments.UpdateAppointmentByIdForReceptionist;
using TeleHealth.Api.Features.Doctors.GetAllDoctors;
using TeleHealth.Api.Features.Doctors.GetDoctorPatientAppointments;
using TeleHealth.Api.Features.Doctors.GetDoctorPatients;
using TeleHealth.Api.Features.Doctors.GetSchedule;
using TeleHealth.Api.Features.LabReports.Complete;
using TeleHealth.Api.Features.LabReports.Download;
using TeleHealth.Api.Features.LabReports.InitializeUpload;
using TeleHealth.Api.Features.Patients.CancelAppointment;
using TeleHealth.Api.Features.Patients.GetAllAppointments;
using TeleHealth.Api.Features.Patients.GetAllPatientsForReceptionist;
using TeleHealth.Api.Features.Patients.GetAppointmentByIdOrSlug;
using TeleHealth.Api.Features.Patients.GetPatientByIdForReceptionist;
using TeleHealth.Api.Features.Patients.GetPatientHistoryForReceptionist;
using TeleHealth.Api.Features.Patients.GetProfile;
using TeleHealth.Api.Features.Patients.RescheduleAppointment;
using TeleHealth.Api.Features.Patients.UpdateMedicalRecord;
using TeleHealth.Api.Features.Schedules.GetAllAvailableSchedules;
using TeleHealth.Api.Features.Schedules.GetDailySchedulesForReceptionist;
using TeleHealth.Api.Features.Users.Create;
using TeleHealth.Api.Features.Users.GetMe;
using TeleHealth.Api.Features.Users.Login;
using TeleHealth.Api.Features.Users.Register;
using TeleHealth.Api.Infrastructure.Aws;
using TeleHealth.Api.Infrastructure.Persistence;
using TeleHealth.Api.Infrastructure.Persistence.Seeding;

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

builder.Services.AddOpenApi(options =>
{
    options.AddSchemaTransformer(
        (schema, context, cancellationToken) =>
        {
            if (context.JsonTypeInfo.Type == typeof(LocalDate))
            {
                schema.Type = Microsoft.OpenApi.JsonSchemaType.String;
                schema.Format = "date";
            }

            if (context.JsonTypeInfo.Type == typeof(LocalTime))
            {
                schema.Type = Microsoft.OpenApi.JsonSchemaType.String;
                schema.Format = "time";
            }

            return Task.CompletedTask;
        }
    );
});

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ConfigureForNodaTime(DateTimeZoneProviders.Tzdb);
});

builder.Services.AddScoped<DatabaseSeeder>();

builder.Services.AddDbContext<ApplicationDbContext>(
    (serviceProvider, options) =>
    {
        options
            .UseNpgsql(
                builder.Configuration.GetConnectionString("Database"),
                o => o.SetPostgresVersion(18, 0).UseNodaTime()
            )
            .UseSnakeCaseNamingConvention();

        if (
            builder.Environment.IsDevelopment()
            || builder.Configuration.GetValue<bool>("Seed:EnableOnStartup")
        )
        {
            options
                .UseSeeding(
                    (ctx, _) =>
                    {
                        var seeder = serviceProvider.GetRequiredService<DatabaseSeeder>();
                        seeder.SeedAsync((ApplicationDbContext)ctx).GetAwaiter().GetResult();
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
builder.Services.AddScoped<BookAppointmentHandler>();
builder.Services.AddScoped<GetAllAppointmentsHandler>();
builder.Services.AddScoped<GetAllAppointmentsForReceptionistHandler>();
builder.Services.AddScoped<ReceptionistGetAppointmentByIdHandler>();
builder.Services.AddScoped<GetAppointmentStatusesHandler>();
builder.Services.AddScoped<UpdateAppointmentByReceptionistHandler>();
builder.Services.AddScoped<DoctorGetAppointmentByIdHandler>();
builder.Services.AddScoped<SubmitConsultationHandler>();
builder.Services.AddScoped<GetAppointmentByIdOrSlugHandler>();
builder.Services.AddScoped<RescheduleAppointmentHandler>();
builder.Services.AddScoped<CancelAppointmentHandler>();
builder.Services.AddScoped<AdminGetAllReceptionistsHandler>();
builder.Services.AddScoped<GetAllDoctorsHandler>();
builder.Services.AddScoped<GetAllAvailableSchedulesHandler>();
builder.Services.AddScoped<GetDailySchedulesHandler>();
builder.Services.AddScoped<GetDoctorScheduleHandler>();
builder.Services.AddScoped<InitializeLabReportHandler>();
builder.Services.AddScoped<CompleteLabReportHandler>();
builder.Services.AddScoped<DownloadLabReportHandler>();
builder.Services.AddScoped<ReceptionistGetAllPatientsHandler>();
builder.Services.AddScoped<ReceptionistGetPatientByIdHandler>();
builder.Services.AddScoped<ReceptionistGetPatientHistoryHandler>();
builder.Services.AddScoped<GetDoctorPatientsHandler>();
builder.Services.AddScoped<GetDoctorPatientAppointmentsHandler>();

builder.Services.AddDefaultAWSOptions(builder.Configuration.GetAWSOptions());
builder.Services.AddAWSService<IAmazonS3>();
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

app.UseHttpsRedirection();

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
api.MapBookAppointmentEndpoint();
api.MapGetMeEndpoint();
api.MapGetAllAppointmentsEndpoint();
api.MapGetAllAppointmentsForReceptionistEndpoint();
api.MapGetAppointmentByIdForReceptionistEndpoint();
api.MapGetAppointmentStatusesEndpoint();
api.MapUpdateAppointmentByReceptionistEndpoint();
api.MapGetAppointmentByIdForDoctorEndpoint();
api.MapSubmitConsultationEndpoint();
api.MapGetAppointmentByIdOrSlugEndpoint();
api.MapRescheduleAppointmentEndpoint();
api.MapCancelAppointmentEndpoint();
api.MapAdminGetAllReceptionistsEndpoint();
api.MapGetAllDoctorsEndpoint();
api.MapGetAllAvailableSchedulesEndpoint();
api.MapGetDailySchedulesEndpoint();
api.MapGetDoctorScheduleEndpoint();
api.MapInitializeLabReportEndpoint();
api.MapCompleteLabReportsEndpoint();
api.MapDownloadLabReportEndpoint();
api.MapReceptionistGetAllPatientsEndpoint();
api.MapReceptionistGetPatientByIdEndpoint();
api.MapReceptionistGetPatientHistoryEndpoint();
api.MapGetDoctorPatientsEndpoint();
api.MapGetDoctorPatientAppointmentsEndpoint();

app.UseSerilogRequestLogging();

Log.Information("TeleHealth API successfully started.");

await app.RunAsync();
