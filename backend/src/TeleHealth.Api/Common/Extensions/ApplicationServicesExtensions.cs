using Amazon.S3;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
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
using TeleHealth.Api.Features.Admins.GetLabTech;
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
using TeleHealth.Api.Features.Schedules.CreateSchedule;
using TeleHealth.Api.Features.Schedules.DeleteSchedule;
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

namespace TeleHealth.Api.Common.Extensions;

public static class ApplicationServicesExtensions
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        services.AddValidatorsFromAssemblyContaining<Program>();

        services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
        services.AddScoped<ITokenService, TokenService>();

        services.AddScoped<LoginHandler>();
        services.AddScoped<RegisterPatientHandler>();
        services.AddScoped<CreateUserHandler>();
        services.AddScoped<GetProfileHandler>();
        services.AddScoped<UpdateMedicalRecordHandler>();
        services.AddScoped<BookAppointmentHandler>();
        services.AddScoped<GetAllAppointmentsHandler>();
        services.AddScoped<GetAllAppointmentsForReceptionistHandler>();
        services.AddScoped<ReceptionistGetAppointmentByIdHandler>();
        services.AddScoped<GetAppointmentStatusesHandler>();
        services.AddScoped<UpdateAppointmentByReceptionistHandler>();
        services.AddScoped<RemindPatientHandler>();
        services.AddScoped<DoctorGetAppointmentByIdHandler>();
        services.AddScoped<SubmitConsultationHandler>();
        services.AddScoped<GetAppointmentByIdOrSlugHandler>();
        services.AddScoped<RescheduleAppointmentHandler>();
        services.AddScoped<CancelAppointmentHandler>();
        services.AddScoped<AdminGetAllDepartmentsHandler>();
        services.AddScoped<AdminCreateDepartmentHandler>();
        services.AddScoped<AdminUpdateDepartmentHandler>();
        services.AddScoped<AdminDeleteDepartmentHandler>();
        services.AddScoped<AdminGetAllReceptionistsHandler>();
        services.AddScoped<AdminCreateReceptionistHandler>();
        services.AddScoped<AdminUpdateReceptionistHandler>();
        services.AddScoped<AdminDeleteReceptionistHandler>();
        services.AddScoped<AdminGetAllLabTechsHandler>();
        services.AddScoped<AdminGetLabTechHandler>();
        services.AddScoped<AdminCreateLabTechHandler>();
        services.AddScoped<AdminUpdateLabTechHandler>();
        services.AddScoped<AdminDeleteLabTechHandler>();
        services.AddScoped<CreateDoctorHandler>();
        services.AddScoped<GetAllDoctorsHandler>();
        services.AddScoped<UpdateDoctorHandler>();
        services.AddScoped<DeleteDoctorHandler>();
        services.AddScoped<CreateScheduleHandler>();
        services.AddScoped<DeleteScheduleHandler>();
        services.AddScoped<GetAllAvailableSchedulesHandler>();
        services.AddScoped<GetDailySchedulesHandler>();
        services.AddScoped<GetDoctorScheduleHandler>();
        services.AddScoped<InitializeLabReportHandler>();
        services.AddScoped<CompleteLabReportHandler>();
        services.AddScoped<DownloadLabReportHandler>();
        services.AddScoped<LabTechGetAllPatientsHandler>();
        services.AddScoped<GetAllLabReportsHandler>();
        services.AddScoped<ReceptionistGetAllPatientsHandler>();
        services.AddScoped<ReceptionistGetPatientByIdHandler>();
        services.AddScoped<ReceptionistGetPatientHistoryHandler>();
        services.AddScoped<GetDoctorPatientsHandler>();
        services.AddScoped<GetDoctorPatientAppointmentsHandler>();
        services.AddScoped<ClinicStaffGetAllPatientsHandler>();
        services.AddScoped<UpdatePatientRecordHandler>();
        services.AddScoped<DeletePatientHandler>();
        services.AddScoped<UpdateProfileHandler>();
        services.AddScoped<UpdateReceptionistProfileHandler>();

        services.AddDefaultAWSOptions(configuration.GetAWSOptions());
        services.AddAWSService<IAmazonS3>();
        services.AddScoped<IS3Service, S3Service>();

        services.AddHttpContextAccessor();

        return services;
    }
}
