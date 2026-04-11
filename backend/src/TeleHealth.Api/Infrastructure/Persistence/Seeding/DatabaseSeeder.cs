using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NodaTime;
using Serilog;
using Slugify;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Seeding;

/// Registered as a scoped service and invoked via EF Core's UseAsyncSeeding hook.
public sealed class DatabaseSeeder(
    IPasswordHasher<User> passwordHasher,
    IConfiguration configuration
)
{
    private readonly SlugHelper slugHelper = new();

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

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        try
        {
            // Phase 1 — Users (get IDs from DB)
            var doctorData = SeedFakers.BuildDoctorUsers(
                faker,
                passwordHasher,
                defaultPassword,
                departments,
                slugHelper
            );
            var patientData = SeedFakers.BuildPatientUsers(
                faker,
                passwordHasher,
                defaultPassword,
                slugHelper
            );

            db.Users.AddRange(doctorData.Select(d => d.User));
            db.Users.AddRange(patientData.Select(p => p.User));
            await db.SaveChangesAsync(ct);

            // Phase 2 — Profiles + UserRoles (FKs resolved)
            db.UserRoles.AddRange(
                doctorData.Select(d => new UserRole
                {
                    UserId = d.User.Id,
                    RoleId = roles["doctor"].Id,
                })
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

            // Phase 3 — Schedules
            var today = SystemClock.Instance.GetCurrentInstant().InUtc().Date;
            var doctors = doctorData.Select(d => d.Doctor).ToList();

            var schedules = SeedFakers.BuildDoctorSchedules(
                doctors,
                today,
                availableStatusId: scheduleStatuses["available"].Id
            );
            db.DoctorSchedules.AddRange(schedules);
            await db.SaveChangesAsync(ct);

            // Phase 4 — Appointments
            var patients = patientData.Select(p => p.Patient).ToList();

            var (appointments, touchedSchedules) = SeedFakers.BuildAppointments(
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

            // Phase 5 — Consultations for completed appointments
            var consultations = SeedFakers.BuildConsultations(faker, appointments, slugHelper);
            db.Consultations.AddRange(consultations);
            await db.SaveChangesAsync(ct);

            await transaction.CommitAsync(ct);

            Log.Information(
                "Seeding complete: {Doctors} doctors, {Patients} patients, {Schedules} schedules, {Appointments} appointments, {Consultations} consultations",
                doctors.Count,
                patients.Count,
                schedules.Count,
                appointments.Count,
                consultations.Count
            );
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(ct);
            Log.Error(
                ex,
                "Seeding failed and was rolled back. The database is clean — next run will retry."
            );
        }
    }
}
