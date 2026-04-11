using Bogus;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Extensions;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(
        ApplicationDbContext db,
        IPasswordHasher<User> passwordHasher
    )
    {
        // 1. Check if we already seeded to avoid duplicates!
        if (await db.Users.AnyAsync())
        {
            Log.Information("Database already contains data. Skipping Bogus seeding.");
            return;
        }

        Log.Information("Seeding database with Bogus fake data...");

        // Ensure we only use predictable Malaysian/English data
        Randomizer.Seed = new Random(888);
        var faker = new Faker("en");

        // 2. Fetch Roles & Departments we hardcoded earlier
        var patientRole = await db.Roles.SingleAsync(r => r.Slug == "patient");
        var doctorRole = await db.Roles.SingleAsync(r => r.Slug == "doctor");
        var generalDept = await db.Departments.SingleAsync(r => r.Slug == "general");

        // ==========================================
        // 3. SEED DOCTORS (Level 1 & 2)
        // ==========================================
        var doctors = new List<Doctor>();
        for (int i = 0; i < 3; i++)
        {
            var publicId = Guid.NewGuid();
            var firstName = faker.Name.FirstName();
            var lastName = faker.Name.LastName();
            var email = $"dr.{firstName.ToLower()}@telehealth.com";

            var user = new User
            {
                PublicId = publicId,
                Slug = $"dr-{firstName}-{lastName}".Slugify(publicId.ToString()[..8]),
                Username = email,
                Email = email,
                PasswordHash = passwordHasher.HashPassword(null!, "Password123!"), // Known password for UI testing!
                FirstName = firstName,
                LastName = lastName,
                Gender = faker.PickRandom('M', 'F'),
                DateOfBirth = LocalDate.FromDateTime(
                    faker.Date.Past(40, DateTime.Now.AddYears(-30))
                ),
                IcNumber = faker.Random.Replace("############"),
                Roles = [doctorRole],
            };

            var doctor = new Doctor
            {
                PublicId = Guid.NewGuid(),
                Slug = $"doc-{user.Slug}",
                User = user,
                DepartmentId = generalDept.Id,
                LicenseNumber = "MMC-" + faker.Random.Number(10000, 99999),
                Specialization = "General Practice",
                ConsultationFee = faker.Random.Decimal(50, 150),
                Bio = faker.Lorem.Paragraph(),
                Qualifications = [new Qualification("MBBS", "University Malaya", 2015)],
            };

            doctors.Add(doctor);
            db.Users.Add(user);
            db.Doctors.Add(doctor);
        }

        // ==========================================
        // 4. SEED DOCTOR SCHEDULES (Level 3)
        // ==========================================
        var today = SystemClock.Instance.GetCurrentInstant().InUtc().Date;

        foreach (var doc in doctors)
        {
            // Create 5 days of schedules for each doctor
            for (int day = 0; day < 5; day++)
            {
                var scheduleDate = today.PlusDays(day);

                // 9 AM to 10 AM (Two 30-min slots)
                db.DoctorSchedules.Add(
                    new DoctorSchedule
                    {
                        PublicId = Guid.NewGuid(),
                        Doctor = doc,
                        StatusId = 1, // Available
                        Date = scheduleDate,
                        StartTime = new LocalTime(9, 0),
                        EndTime = new LocalTime(9, 30),
                    }
                );

                db.DoctorSchedules.Add(
                    new DoctorSchedule
                    {
                        PublicId = Guid.NewGuid(),
                        Doctor = doc,
                        StatusId = 1, // Available
                        Date = scheduleDate,
                        StartTime = new LocalTime(9, 30),
                        EndTime = new LocalTime(10, 0),
                    }
                );
            }
        }

        // ==========================================
        // 5. SEED PATIENTS (Level 1 & 2)
        // ==========================================
        for (int i = 0; i < 10; i++)
        {
            var publicId = Guid.NewGuid();
            var email = $"patient{i}@test.com";

            var user = new User
            {
                PublicId = publicId,
                Slug = $"pt-{publicId.ToString()[..8]}",
                Username = email,
                Email = email,
                PasswordHash = passwordHasher.HashPassword(null!, "Password123!"),
                FirstName = faker.Name.FirstName(),
                LastName = faker.Name.LastName(),
                Gender = faker.PickRandom('M', 'F'),
                DateOfBirth = LocalDate.FromDateTime(
                    faker.Date.Past(30, DateTime.Now.AddYears(-20))
                ),
                IcNumber = faker.Random.Replace("############"),
                Roles = [patientRole],
            };

            var patient = new Patient
            {
                PublicId = Guid.NewGuid(),
                Slug = $"patient-profile-{i}",
                User = user,
                BloodGroup = faker.PickRandom("A+", "B+", "O+", "AB-"),
            };

            db.Users.Add(user);
            db.Patients.Add(patient);
        }

        // 6. SAVE EVERYTHING ATOMICALLY!
        await db.SaveChangesAsync();
        Log.Information("✅ Successfully seeded Doctors, Schedules, and Patients!");
    }
}
