using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using Slugify;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence.Seeding.Fakers;

namespace TeleHealth.Api.Infrastructure.Persistence.Seeding;

/// Registered as a scoped service and invoked via EF Core's UseAsyncSeeding hook.
public sealed class DatabaseSeeder(
    IPasswordHasher<User> passwordHasher,
    IConfiguration configuration
)
{
    private readonly SlugHelper _slugHelper = new();

    public async Task SeedAsync(ApplicationDbContext db, CancellationToken ct = default)
    {
        if (await db.Users.AnyAsync(ct))
        {
            Log.Information("Database already contains data. Skipping seeding.");
            return;
        }

        Log.Information("Seeding database with Bogus fake data...");

        var defaultPassword = configuration["Seed:DefaultPassword"] ?? "Password123!";
        var faker = SeedFakers.CreateFaker();

        var roles = await db.Roles.ToDictionaryAsync(r => r.Slug, ct);
        var departments = await db.Departments.ToDictionaryAsync(d => d.Slug, ct);
        var scheduleStatuses = await db.ScheduleStatuses.ToDictionaryAsync(s => s.Slug, ct);
        var appointmentStatuses = await db.AppointmentStatuses.ToDictionaryAsync(s => s.Slug, ct);
        var labReportStatuses = await db.LabReportStatuses.ToDictionaryAsync(s => s.Slug, ct);

        // Phase 1: Build all users
        var adminUsers = AdminFaker.BuildAdminUsers(
            faker,
            passwordHasher,
            defaultPassword,
            _slugHelper
        );
        var receptionistUsers = ReceptionistFaker.BuildReceptionistUsers(
            faker,
            passwordHasher,
            defaultPassword,
            _slugHelper
        );
        var labTechUsers = LabTechFaker.BuildLabTechUsers(
            faker,
            passwordHasher,
            defaultPassword,
            _slugHelper
        );

        var doctorData = DoctorFaker.BuildDoctorUsers(
            faker,
            passwordHasher,
            defaultPassword,
            departments,
            _slugHelper
        );
        var patientData = PatientFaker.BuildPatientUsers(
            faker,
            passwordHasher,
            defaultPassword,
            _slugHelper
        );

        db.Users.AddRange(adminUsers);
        db.Users.AddRange(receptionistUsers);
        db.Users.AddRange(labTechUsers);
        db.Users.AddRange(doctorData.Select(d => d.User));
        db.Users.AddRange(patientData.Select(p => p.User));
        await db.SaveChangesAsync(ct);

        // Phase 2: Profiles + UserRoles (FKs resolved after Phase 1)
        db.UserRoles.AddRange(
            adminUsers.Select(u => new UserRole { UserId = u.Id, RoleId = roles["admin"].Id })
        );
        db.UserRoles.AddRange(
            receptionistUsers.Select(u => new UserRole
            {
                UserId = u.Id,
                RoleId = roles["receptionist"].Id,
            })
        );
        db.UserRoles.AddRange(
            labTechUsers.Select(u => new UserRole { UserId = u.Id, RoleId = roles["lab-tech"].Id })
        );
        db.UserRoles.AddRange(
            doctorData.Select(d => new UserRole { UserId = d.User.Id, RoleId = roles["doctor"].Id })
        );
        db.UserRoles.AddRange(
            patientData.Select(p => new UserRole
            {
                UserId = p.User.Id,
                RoleId = roles["patient"].Id,
            })
        );

        foreach (var (user, doctor) in doctorData)
        {
            doctor.UserId = user.Id;
            db.Doctors.Add(doctor);
        }

        foreach (var (user, patient) in patientData)
        {
            patient.UserId = user.Id;
            db.Patients.Add(patient);
        }

        await db.SaveChangesAsync(ct);

        // Phase 3: Schedules
        var today = SystemClock.Instance.GetCurrentInstant().InUtc().Date;
        var doctors = doctorData.Select(d => d.Doctor).ToList();

        var schedules = ScheduleFaker.BuildDoctorSchedules(
            doctors,
            today,
            availableStatusId: scheduleStatuses["available"].Id
        );
        db.DoctorSchedules.AddRange(schedules);
        await db.SaveChangesAsync(ct);

        // Phase 4: Appointments
        var patients = patientData.Select(p => p.Patient).ToList();

        var (appointments, touchedSchedules) = AppointmentFaker.BuildAppointments(
            faker,
            doctors,
            patients,
            schedules,
            doctorData[0].User,
            appointmentStatuses,
            scheduleStatuses
        );

        foreach (var schedule in touchedSchedules)
            db.Entry(schedule).Property(s => s.StatusId).IsModified = true;

        db.Appointments.AddRange(appointments);
        await db.SaveChangesAsync(ct);

        // Phase 5: Consultations
        var consultations = ConsultationFaker.BuildConsultations(faker, appointments, _slugHelper);
        db.Consultations.AddRange(consultations);
        await db.SaveChangesAsync(ct);

        // Phase 6: Prescriptions
        var prescriptions = PrescriptionFaker.BuildPrescriptions(faker, consultations);
        db.Prescriptions.AddRange(prescriptions);
        await db.SaveChangesAsync(ct);

        // Phase 7: Lab Reports
        var labReports = LabReportFaker.BuildLabReports(
            faker,
            consultations,
            patients,
            labReportStatuses,
            _slugHelper
        );
        db.LabReports.AddRange(labReports);
        await db.SaveChangesAsync(ct);

        Log.Information(
            "Seeding complete: {Admins} admins, {Receptionists} receptionists, {LabTechs} lab techs, "
                + "{Doctors} doctors, {Patients} patients, {Schedules} schedules, "
                + "{Appointments} appointments, {Consultations} consultations, "
                + "{Prescriptions} prescriptions, {LabReports} lab reports",
            adminUsers.Count,
            receptionistUsers.Count,
            labTechUsers.Count,
            doctors.Count,
            patients.Count,
            schedules.Count,
            appointments.Count,
            consultations.Count,
            prescriptions.Count,
            labReports.Count
        );
    }
}
