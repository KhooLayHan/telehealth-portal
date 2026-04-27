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
using TeleHealth.Api.Features.Admins.CreateDepartment;
using TeleHealth.Api.Features.Admins.CreateLabTech;
using TeleHealth.Api.Features.Admins.CreateReceptionist;
using TeleHealth.Api.Features.Admins.DeleteDepartment;
using TeleHealth.Api.Features.Admins.DeleteLabTech;
using TeleHealth.Api.Features.Admins.DeleteReceptionist;
using TeleHealth.Api.Features.Admins.GetAllDepartments;
using TeleHealth.Api.Features.Admins.GetAllLabTechs;
using TeleHealth.Api.Features.Admins.GetAllReceptionists;
using TeleHealth.Api.Features.Admins.UpdateDepartment;
using TeleHealth.Api.Features.Admins.UpdateLabTech;
using TeleHealth.Api.Features.Admins.UpdateReceptionist;
using TeleHealth.Api.Features.Appointments.Book;
using TeleHealth.Api.Features.Appointments.GetAllAppointments;
using TeleHealth.Api.Features.Appointments.GetAppointmentByIdForDoctor;
using TeleHealth.Api.Features.Appointments.GetAppointmentsById;
using TeleHealth.Api.Features.Appointments.GetAppointmentStatuses;
using TeleHealth.Api.Features.Appointments.Remind;
using TeleHealth.Api.Features.Appointments.SubmitConsultation;
using TeleHealth.Api.Features.Appointments.UpdateAppointmentByIdForReceptionist;
using TeleHealth.Api.Features.Doctors.CreateDoctor;
using TeleHealth.Api.Features.Doctors.DeleteDoctor;
using TeleHealth.Api.Features.Doctors.GetAllDoctors;
using TeleHealth.Api.Features.Doctors.GetDoctorPatientAppointments;
using TeleHealth.Api.Features.Doctors.GetDoctorPatients;
using TeleHealth.Api.Features.Doctors.GetSchedule;
using TeleHealth.Api.Features.Doctors.UpdateDoctor;
using TeleHealth.Api.Features.LabReports.Complete;
using TeleHealth.Api.Features.LabReports.Download;
using TeleHealth.Api.Features.LabReports.GetAllLabReports;
using TeleHealth.Api.Features.LabReports.GetAllPatients;
using TeleHealth.Api.Features.LabReports.InitializeUpload;
using TeleHealth.Api.Features.Patients.CancelAppointment;
using TeleHealth.Api.Features.Patients.DeletePatient;
using TeleHealth.Api.Features.Patients.GetAllAppointments;
using TeleHealth.Api.Features.Patients.GetAllPatientsForClinicStaff;
using TeleHealth.Api.Features.Patients.GetAllPatientsForReceptionist;
using TeleHealth.Api.Features.Patients.GetAppointmentByIdOrSlug;
using TeleHealth.Api.Features.Patients.GetPatientByIdForReceptionist;
using TeleHealth.Api.Features.Patients.GetPatientHistoryForReceptionist;
using TeleHealth.Api.Features.Patients.GetProfile;
using TeleHealth.Api.Features.Patients.RescheduleAppointment;
using TeleHealth.Api.Features.Patients.UpdateMedicalRecord;
using TeleHealth.Api.Features.Patients.UpdatePatientRecord;
using TeleHealth.Api.Features.Schedules.GetAllAvailableSchedules;
using TeleHealth.Api.Features.Schedules.GetDailySchedulesForReceptionist;
using TeleHealth.Api.Features.Users.Create;
using TeleHealth.Api.Features.Users.DoctorProfile;
using TeleHealth.Api.Features.Users.GetMe;
using TeleHealth.Api.Features.Users.Login;
using TeleHealth.Api.Features.Users.ProfileAvatar;
using TeleHealth.Api.Features.Users.ReceptionistProfile;
using TeleHealth.Api.Features.Users.Register;
using TeleHealth.Api.Features.Users.UpdateProfile;
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

            if (context.JsonTypeInfo.Type == typeof(Instant))
            {
                schema.Type = Microsoft.OpenApi.JsonSchemaType.String;
                schema.Format = "date-time";
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
builder.Services.AddScoped<RemindPatientHandler>();
builder.Services.AddScoped<DoctorGetAppointmentByIdHandler>();
builder.Services.AddScoped<SubmitConsultationHandler>();
builder.Services.AddScoped<GetAppointmentByIdOrSlugHandler>();
builder.Services.AddScoped<RescheduleAppointmentHandler>();
builder.Services.AddScoped<CancelAppointmentHandler>();
builder.Services.AddScoped<AdminGetAllDepartmentsHandler>();
builder.Services.AddScoped<AdminCreateDepartmentHandler>();
builder.Services.AddScoped<AdminUpdateDepartmentHandler>();
builder.Services.AddScoped<AdminDeleteDepartmentHandler>();
builder.Services.AddScoped<AdminGetAllReceptionistsHandler>();
builder.Services.AddScoped<AdminCreateReceptionistHandler>();
builder.Services.AddScoped<AdminUpdateReceptionistHandler>();
builder.Services.AddScoped<AdminDeleteReceptionistHandler>();
builder.Services.AddScoped<AdminGetAllLabTechsHandler>();
builder.Services.AddScoped<AdminCreateLabTechHandler>();
builder.Services.AddScoped<AdminUpdateLabTechHandler>();
builder.Services.AddScoped<AdminDeleteLabTechHandler>();
builder.Services.AddScoped<CreateDoctorHandler>();
builder.Services.AddScoped<GetAllDoctorsHandler>();
builder.Services.AddScoped<UpdateDoctorHandler>();
builder.Services.AddScoped<DeleteDoctorHandler>();
builder.Services.AddScoped<GetAllAvailableSchedulesHandler>();
builder.Services.AddScoped<GetDailySchedulesHandler>();
builder.Services.AddScoped<GetDoctorScheduleHandler>();
builder.Services.AddScoped<InitializeLabReportHandler>();
builder.Services.AddScoped<CompleteLabReportHandler>();
builder.Services.AddScoped<DownloadLabReportHandler>();
builder.Services.AddScoped<LabTechGetAllPatientsHandler>();
builder.Services.AddScoped<GetAllLabReportsHandler>();
builder.Services.AddScoped<ReceptionistGetAllPatientsHandler>();
builder.Services.AddScoped<ReceptionistGetPatientByIdHandler>();
builder.Services.AddScoped<ReceptionistGetPatientHistoryHandler>();
builder.Services.AddScoped<GetDoctorPatientsHandler>();
builder.Services.AddScoped<GetDoctorPatientAppointmentsHandler>();
builder.Services.AddScoped<ClinicStaffGetAllPatientsHandler>();
builder.Services.AddScoped<UpdatePatientRecordHandler>();
builder.Services.AddScoped<DeletePatientHandler>();
builder.Services.AddScoped<UpdateProfileHandler>();
builder.Services.AddScoped<UpdateReceptionistProfileHandler>();

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

app.UseSerilogRequestLogging();
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
api.MapGetDoctorProfileEndpoint();
api.MapGetReceptionistProfileEndpoint();
api.MapUpdateReceptionistProfileEndpoint();
api.MapGetAvatarUploadUrlEndpoint();
api.MapUpdateAvatarEndpoint();
api.MapUpdateProfileEndpoint();
api.MapGetAllAppointmentsEndpoint();
api.MapGetAllAppointmentsForReceptionistEndpoint();
api.MapGetAppointmentByIdForReceptionistEndpoint();
api.MapGetAppointmentStatusesEndpoint();
api.MapUpdateAppointmentByReceptionistEndpoint();
api.MapRemindPatientEndpoint();
api.MapGetAppointmentByIdForDoctorEndpoint();
api.MapSubmitConsultationEndpoint();
api.MapGetAppointmentByIdOrSlugEndpoint();
api.MapRescheduleAppointmentEndpoint();
api.MapCancelAppointmentEndpoint();
api.MapAdminGetAllDepartmentsEndpoint();
api.MapAdminCreateDepartmentEndpoint();
api.MapAdminUpdateDepartmentEndpoint();
api.MapAdminDeleteDepartmentEndpoint();
api.MapAdminGetAllReceptionistsEndpoint();
api.MapAdminCreateReceptionistEndpoint();
api.MapAdminUpdateReceptionistEndpoint();
api.MapAdminDeleteReceptionistEndpoint();
api.MapAdminGetAllLabTechsEndpoint();
api.MapAdminCreateLabTechEndpoint();
api.MapAdminUpdateLabTechEndpoint();
api.MapAdminDeleteLabTechEndpoint();
api.MapCreateDoctorEndpoint();
api.MapGetAllDoctorsEndpoint();
api.MapUpdateDoctorEndpoint();
api.MapDeleteDoctorEndpoint();
api.MapGetAllAvailableSchedulesEndpoint();
api.MapGetDailySchedulesEndpoint();
api.MapGetDoctorScheduleEndpoint();
api.MapInitializeLabReportEndpoint();
api.MapCompleteLabReportsEndpoint();
api.MapDownloadLabReportEndpoint();
api.MapGetAllLabReportsEndpoint();
api.MapLabTechGetAllPatientsEndpoint();
api.MapReceptionistGetAllPatientsEndpoint();
api.MapReceptionistGetPatientByIdEndpoint();
api.MapReceptionistGetPatientHistoryEndpoint();
api.MapClinicStaffGetAllPatientsEndpoint();
api.MapUpdatePatientRecordEndpoint();
api.MapDeletePatientEndpoint();
api.MapGetDoctorPatientsEndpoint();
api.MapGetDoctorPatientAppointmentsEndpoint();

Log.Information("TeleHealth API successfully started.");

await app.RunAsync();
