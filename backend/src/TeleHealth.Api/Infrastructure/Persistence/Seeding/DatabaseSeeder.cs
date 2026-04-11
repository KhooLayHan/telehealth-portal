using System.Globalization;
using Bogus;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Extensions;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    // Malaysian NRIC: YYMMDD-PB-#### where PB is a 2-digit place-of-birth code
    private static readonly string[] stateCodes =
    [
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
    ];

    public static async Task SeedAsync(
        ApplicationDbContext db,
        IPasswordHasher<User> passwordHasher,
        IConfiguration configuration
    )
    {
        if (await db.Users.AnyAsync())
        {
            Log.Information("Database already contains data. Skipping seeding.");
            return;
        }

        Log.Information("Seeding database with Bogus fake data...");

        // Isolated faker instance — no global state mutation
        var faker = new Faker("en") { Random = new Randomizer(888) };
        var defaultPassword = configuration["Seed:DefaultPassword"] ?? "Password123!";

        // Fetch seeded lookup data
        var roles = await db.Roles.ToDictionaryAsync(r => r.Slug);
        var departments = await db.Departments.ToDictionaryAsync(d => d.Slug);

        // ==========================================
        // PHASE 1 — Users, Doctors, Patients
        // ==========================================
        var doctorUsers = BuildDoctorUsers(
            faker,
            passwordHasher,
            defaultPassword,
            roles,
            departments
        );
        var patientUsers = BuildPatientUsers(faker, passwordHasher, defaultPassword, roles);

        db.Users.AddRange(doctorUsers.Select(t => t.User));
        db.Users.AddRange(patientUsers.Select(t => t.User));

        // Save to get IDs back for FK linking
        await db.SaveChangesAsync();

        // Now wire up UserRoles through the junction table
        var userRoles = doctorUsers
            .Select(t => new UserRole { UserId = t.User.Id, RoleId = roles["doctor"].Id })
            .Concat(
                patientUsers.Select(t => new UserRole
                {
                    UserId = t.User.Id,
                    RoleId = roles["patient"].Id,
                })
            );

        db.UserRoles.AddRange(userRoles);

        // Now wire up Doctor and Patient profiles with resolved IDs
        foreach (var (user, doctor) in doctorUsers)
        {
            doctor.UserId = user.Id; // safe now that user has a real Id
            db.Doctors.Add(doctor);
        }

        foreach (var (user, patient) in patientUsers)
        {
            patient.UserId = user.Id;
            db.Patients.Add(patient);
        }

        await db.SaveChangesAsync();

        // ==========================================
        // PHASE 2 — Doctor Schedules
        // ==========================================
        var today = SystemClock.Instance.GetCurrentInstant().InUtc().Date;
        var doctors = doctorUsers.Select(t => t.Doctor).ToList();

        var schedules = BuildDoctorSchedules(doctors, today);
        db.DoctorSchedules.AddRange(schedules);

        await db.SaveChangesAsync();

        // ==========================================
        // PHASE 3 — Appointments (past + upcoming)
        // ==========================================
        var patients = patientUsers.Select(t => t.Patient).ToList();
        var adminUser = doctorUsers[0].User; // use first doctor's user as "created by" stand-in

        var appointments = BuildAppointments(faker, doctors, patients, schedules, adminUser);
        db.Appointments.AddRange(appointments);

        await db.SaveChangesAsync();

        // ==========================================
        // PHASE 4 — Consultations for completed appointments
        // ==========================================
        var consultations = BuildConsultations(faker, appointments);
        db.Consultations.AddRange(consultations);

        await db.SaveChangesAsync();

        Log.Information(
            "Seeding complete: {Doctors} doctors, {Patients} patients, {Schedules} schedules, {Appointments} appointments",
            doctors.Count,
            patients.Count,
            schedules.Count,
            appointments.Count
        );
    }

    // ─────────────────────────────────────────────
    // Builders
    // ─────────────────────────────────────────────

    private static List<(User User, Doctor Doctor)> BuildDoctorUsers(
        Faker faker,
        IPasswordHasher<User> hasher,
        string password,
        Dictionary<string, Role> roles,
        Dictionary<string, Department> departments
    )
    {
        var specializations = new[]
        {
            ("general", "General Practice"),
            ("cardiology", "Cardiology"),
            ("pediatrics", "Pediatrics"),
        };

        return specializations
            .Select(spec =>
            {
                var publicId = Guid.NewGuid();
                var firstName = faker.Name.FirstName();
                var lastName = faker.Name.LastName();

                var userFaker = new Faker<User>("en")
                    .RuleFor(u => u.PublicId, publicId)
                    .RuleFor(
                        u => u.Slug,
                        $"dr-{firstName}-{lastName}".Slugify(publicId.ToString()[..8])
                    )
                    .RuleFor(
                        u => u.Username,
                        $"dr.{firstName.ToLower()}.{lastName.ToLower()}@telehealth.com"
                    )
                    .RuleFor(u => u.Email, (f, u) => u.Username)
                    .RuleFor(u => u.FirstName, firstName)
                    .RuleFor(u => u.LastName, lastName)
                    .RuleFor(u => u.Gender, f => f.PickRandom('M', 'F'))
                    .RuleFor(
                        u => u.DateOfBirth,
                        f => LocalDate.FromDateTime(f.Date.Past(20, DateTime.Now.AddYears(-35)))
                    )
                    .RuleFor(u => u.IcNumber, f => GenerateMalaysianIcNumber(f))
                    .RuleFor(u => u.Phone, f => $"+601{f.Random.Number(10000000, 99999999)}")
                    .RuleFor(u => u.PasswordHash, (_, u) => hasher.HashPassword(u, password));

                var user = userFaker.Generate();

                var doctorFaker = new Faker<Doctor>("en")
                    .RuleFor(d => d.PublicId, Guid.NewGuid())
                    .RuleFor(
                        d => d.Slug,
                        f =>
                            $"doc-{firstName.ToLower()}-{lastName.ToLower()}-{f.Random.AlphaNumeric(4)}"
                    )
                    .RuleFor(d => d.DepartmentId, departments[spec.Item1].Id)
                    .RuleFor(d => d.LicenseNumber, f => $"MMC-{f.Random.Number(10000, 99999)}")
                    .RuleFor(d => d.Specialization, spec.Item2)
                    .RuleFor(d => d.ConsultationFee, f => Math.Round(f.Random.Decimal(80, 200), 2))
                    .RuleFor(d => d.Bio, f => f.Lorem.Paragraph(2))
                    .RuleFor(
                        d => d.Qualifications,
                        f =>
                            [
                                new Qualification(
                                    "MBBS",
                                    f.PickRandom("University Malaya", "UKM", "USM"),
                                    f.Random.Number(2005, 2015)
                                ),
                                new Qualification(
                                    $"Fellowship in {spec.Item2}",
                                    "National Specialist Centre",
                                    f.Random.Number(2016, 2020)
                                ),
                            ]
                    );

                // UserId is set in phase 2 once the user has a DB-assigned Id
                var doctor = doctorFaker.Generate();

                return (user, doctor);
            })
            .ToList();
    }

    private static List<(User User, Patient Patient)> BuildPatientUsers(
        Faker faker,
        IPasswordHasher<User> hasher,
        string password,
        Dictionary<string, Role> roles
    )
    {
        return Enumerable
            .Range(0, 10)
            .Select(i =>
            {
                var publicId = Guid.NewGuid();

                var userFaker = new Faker<User>("en")
                    .RuleFor(u => u.PublicId, publicId)
                    .RuleFor(u => u.Slug, $"pt-{publicId.ToString()[..8]}")
                    .RuleFor(u => u.Email, f => $"patient{i}@test.com")
                    .RuleFor(u => u.Username, (_, u) => u.Email)
                    .RuleFor(u => u.FirstName, f => f.Name.FirstName())
                    .RuleFor(u => u.LastName, f => f.Name.LastName())
                    .RuleFor(u => u.Gender, f => f.PickRandom('M', 'F'))
                    .RuleFor(
                        u => u.DateOfBirth,
                        f => LocalDate.FromDateTime(f.Date.Past(30, DateTime.Now.AddYears(-20)))
                    )
                    .RuleFor(u => u.IcNumber, f => GenerateMalaysianIcNumber(f))
                    .RuleFor(u => u.Phone, f => $"+601{f.Random.Number(10000000, 99999999)}")
                    .RuleFor(u => u.PasswordHash, (_, u) => hasher.HashPassword(u, password));

                var user = userFaker.Generate();

                var patientFaker = new Faker<Patient>("en")
                    .RuleFor(p => p.PublicId, Guid.NewGuid())
                    .RuleFor(p => p.Slug, f => $"patient-profile-{publicId.ToString()[..8]}")
                    .RuleFor(
                        p => p.BloodGroup,
                        f => f.PickRandom("A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-")
                    )
                    .RuleFor(
                        p => p.Allergies,
                        f =>
                            f.Random.Bool(0.4f)
                                ?
                                [
                                    new Allergy(
                                        f.PickRandom(
                                            "Penicillin",
                                            "Shellfish",
                                            "Peanuts",
                                            "Dust Mites",
                                            "Latex"
                                        ),
                                        f.PickRandom("mild", "moderate", "severe"),
                                        f.PickRandom("Hives", "Sneezing", "Anaphylaxis", "Rash")
                                    ),
                                ]
                                : null
                    )
                    .RuleFor(
                        p => p.EmergencyContact,
                        f => new EmergencyContact(
                            f.Name.FullName(),
                            f.PickRandom("Spouse", "Parent", "Sibling", "Child"),
                            $"+601{f.Random.Number(10000000, 99999999)}"
                        )
                    );

                var patient = patientFaker.Generate();

                return (user, patient);
            })
            .ToList();
    }

    private static List<DoctorSchedule> BuildDoctorSchedules(List<Doctor> doctors, LocalDate today)
    {
        var slots = new List<(LocalTime Start, LocalTime End)>
        {
            (new LocalTime(9, 0), new LocalTime(9, 30)),
            (new LocalTime(9, 30), new LocalTime(10, 0)),
            (new LocalTime(10, 0), new LocalTime(10, 30)),
            (new LocalTime(10, 30), new LocalTime(11, 0)),
            (new LocalTime(14, 0), new LocalTime(14, 30)),
            (new LocalTime(14, 30), new LocalTime(15, 0)),
        };

        var schedules = new List<DoctorSchedule>();

        foreach (var doctor in doctors)
        {
            // Past 3 days + today + 5 future days for historical appointment seeding
            for (int day = -3; day <= 5; day++)
            {
                var date = today.PlusDays(day);

                foreach (var (start, end) in slots)
                {
                    schedules.Add(
                        new DoctorSchedule
                        {
                            PublicId = Guid.NewGuid(),
                            DoctorId = doctor.Id,
                            StatusId = 1, // Available — appointments will update this
                            Date = date,
                            StartTime = start,
                            EndTime = end,
                        }
                    );
                }
            }
        }

        return schedules;
    }

    private static List<Appointment> BuildAppointments(
        Faker faker,
        List<Doctor> doctors,
        List<Patient> patients,
        List<DoctorSchedule> schedules,
        User createdByUser
    )
    {
        var appointments = new List<Appointment>();

        // A few past completed appointments for historical data
        var pastSchedules = schedules
            .Where(s => s.Date < SystemClock.Instance.GetCurrentInstant().InUtc().Date)
            .Take(6)
            .ToList();

        foreach (var schedule in pastSchedules)
        {
            var patient = faker.PickRandom(patients);
            var doctor = doctors.First(d => d.Id == schedule.DoctorId);
            var publicId = Guid.NewGuid();

            appointments.Add(
                new Appointment
                {
                    PublicId = publicId,
                    Slug = $"apt-{publicId.ToString()[..8]}",
                    PatientId = patient.Id,
                    DoctorId = doctor.Id,
                    ScheduleId = schedule.Id,
                    StatusId = 4, // Completed
                    CreatedByUserId = createdByUser.Id,
                    VisitReason = faker.PickRandom(
                        "Routine checkup",
                        "Follow-up visit",
                        "Chest pain",
                        "Fever and cough",
                        "Skin rash"
                    ),
                    CheckInDateTime = SystemClock
                        .Instance.GetCurrentInstant()
                        .Minus(Duration.FromDays(faker.Random.Int(1, 3))),
                }
            );
        }

        // A few upcoming booked appointments
        var upcomingSchedules = schedules
            .Where(s => s.Date > SystemClock.Instance.GetCurrentInstant().InUtc().Date)
            .Take(4)
            .ToList();

        foreach (var schedule in upcomingSchedules)
        {
            var patient = faker.PickRandom(patients);
            var doctor = doctors.First(d => d.Id == schedule.DoctorId);
            var publicId = Guid.NewGuid();

            appointments.Add(
                new Appointment
                {
                    PublicId = publicId,
                    Slug = $"apt-{publicId.ToString()[..8]}",
                    PatientId = patient.Id,
                    DoctorId = doctor.Id,
                    ScheduleId = schedule.Id,
                    StatusId = 1, // Booked
                    CreatedByUserId = createdByUser.Id,
                    VisitReason = faker.PickRandom(
                        "Annual health screening",
                        "Blood pressure review",
                        "Diabetes follow-up",
                        "Vaccination"
                    ),
                }
            );
        }

        // One cancelled example
        var cancelledSchedule = schedules
            .Where(s => s.Date >= SystemClock.Instance.GetCurrentInstant().InUtc().Date)
            .Skip(upcomingSchedules.Count)
            .FirstOrDefault();

        if (cancelledSchedule is not null)
        {
            var publicId = Guid.NewGuid();
            appointments.Add(
                new Appointment
                {
                    PublicId = publicId,
                    Slug = $"apt-{publicId.ToString()[..8]}",
                    PatientId = faker.PickRandom(patients).Id,
                    DoctorId = doctors.First(d => d.Id == cancelledSchedule.DoctorId).Id,
                    ScheduleId = cancelledSchedule.Id,
                    StatusId = 5, // Cancelled
                    CreatedByUserId = createdByUser.Id,
                    VisitReason = "General consultation",
                    CancellationReason = "Patient requested cancellation",
                }
            );
        }

        return appointments;
    }

    private static List<Consultation> BuildConsultations(
        Faker faker,
        List<Appointment> appointments
    )
    {
        return appointments
            .Where(a => a.StatusId == 4) // Only completed appointments
            .Select(appointment =>
            {
                var publicId = Guid.NewGuid();

                return new Consultation
                {
                    PublicId = publicId,
                    Slug = $"cons-{publicId.ToString()[..8]}",
                    AppointmentId = appointment.Id,
                    ConsultationNotes = new ConsultationNote(
                        Subjective: faker.Lorem.Sentence(12),
                        Objective: $"BP: {faker.Random.Number(110, 140)}/{faker.Random.Number(70, 90)}, HR: {faker.Random.Number(60, 100)}, Temp: {faker.Random.Double(36.1, 37.5):F1}°C",
                        Assessment: faker.PickRandom(
                            "Hypertension, well controlled.",
                            "Upper respiratory tract infection.",
                            "Type 2 diabetes, follow-up required.",
                            "Musculoskeletal pain, likely mechanical."
                        ),
                        Plan: faker.Lorem.Sentence(10)
                    ),
                    ConsultationDateTime =
                        appointment.CheckInDateTime ?? SystemClock.Instance.GetCurrentInstant(),
                    FollowUpDate = faker.Random.Bool(0.5f)
                        ? SystemClock
                            .Instance.GetCurrentInstant()
                            .InUtc()
                            .Date.PlusDays(faker.Random.Number(7, 30))
                        : null,
                };
            })
            .ToList();
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    /// <summary>
    /// Generates a plausible Malaysian NRIC in the format YYMMDD-PB-####.
    /// </summary>
    private static string GenerateMalaysianIcNumber(Faker f)
    {
        var dob = f.Date.Past(40, DateTime.Now.AddYears(-18));
        var yy = dob.ToString("yy", CultureInfo.InvariantCulture);
        var mm = dob.ToString("MM");
        var dd = dob.ToString("dd");
        var stateCode = f.PickRandom(stateCodes);
        var sequence = f.Random.Number(1000, 9999);

        return $"{yy}{mm}{dd}{stateCode}{sequence}";
    }
}
