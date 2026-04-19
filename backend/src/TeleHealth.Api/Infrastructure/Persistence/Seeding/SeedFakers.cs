using Bogus;

using Microsoft.AspNetCore.Identity;

using NodaTime;

using Slugify;

using TeleHealth.Api.Common.Constants;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Seeding;

internal static class SeedFakers
{
    // Malaysian NRIC state-of-birth codes (01–16)
    private static readonly string[] StateCodes =
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

    private static readonly (string DeptSlug, string Specialization)[] Specializations =
    [
        ("general", "General Practice"),
        ("cardiology", "Cardiology"),
        ("pediatrics", "Pediatrics"),
    ];

    // Creates a deterministic Faker instance. Seed is isolated to this instance.
    internal static Faker CreateFaker() => new("en") { Random = new Randomizer(888) };

    // ─────────────────────────────────────────────
    // Doctors
    // ─────────────────────────────────────────────

    internal static List<(User User, Doctor Doctor)> BuildDoctorUsers(
        Faker faker,
        IPasswordHasher<User> hasher,
        string defaultPassword,
        Dictionary<string, Department> departments,
        SlugHelper slugHelper
    ) =>
        Specializations
            .Select(spec =>
            {
                var publicId = Guid.NewGuid();
                var firstName = faker.Name.FirstName();
                var lastName = faker.Name.LastName();
                var username = $"dr.{firstName.ToLowerInvariant()}.{lastName.ToLowerInvariant()}";
                var shortId = publicId.ToString()[..8];

                var user = new Faker<User>("en")
                    .RuleFor(u => u.PublicId, publicId)
                    .RuleFor(
                        u => u.Slug,
                        slugHelper.GenerateSlug($"dr-{firstName}-{lastName}-{shortId}")
                    )
                    .RuleFor(
                        u => u.Email,
                        $"dr.{firstName.ToLowerInvariant()}-{lastName.ToLowerInvariant()}@telehealth.com"
                    )
                    .RuleFor(u => u.Username, username)
                    .RuleFor(u => u.FirstName, firstName)
                    .RuleFor(u => u.LastName, lastName)
                    .RuleFor(u => u.Gender, f => f.PickRandom('M', 'F'))
                    .RuleFor(
                        u => u.DateOfBirth,
                        f => LocalDate.FromDateTime(f.Date.Past(20, DateTime.Now.AddYears(-35)))
                    )
                    .RuleFor(u => u.IcNumber, f => GenerateMalaysianIcNumber(f))
                    .RuleFor(u => u.Phone, f => $"+601{f.Random.Number(10_000_000, 99_999_999)}")
                    .RuleFor(u => u.PasswordHash, (_, u) => hasher.HashPassword(u, defaultPassword))
                    .Generate();

                var doctor = new Faker<Doctor>("en")
                    .RuleFor(d => d.PublicId, Guid.NewGuid())
                    .RuleFor(
                        d => d.Slug,
                        f =>
                            slugHelper.GenerateSlug(
                                $"doc-{firstName}-{lastName}-{f.Random.AlphaNumeric(4)}"
                            )
                    )
                    .RuleFor(d => d.DepartmentId, departments[spec.DeptSlug].Id)
                    .RuleFor(d => d.LicenseNumber, f => $"MMC-{f.Random.Number(10_000, 99_999)}")
                    .RuleFor(d => d.Specialization, spec.Specialization)
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
                                    $"Fellowship in {spec.Specialization}",
                                    "National Specialist Centre",
                                    f.Random.Number(2016, 2021)
                                ),
                            ]
                    )
                    .Generate();

                // UserId resolved in Phase 2 after SaveChangesAsync
                return (user, doctor);
            })
            .ToList();

    // ─────────────────────────────────────────────
    // Patients
    // ─────────────────────────────────────────────

    internal static List<(User User, Patient Patient)> BuildPatientUsers(
        Faker faker,
        IPasswordHasher<User> hasher,
        string defaultPassword,
        SlugHelper slugHelper
    ) =>
        Enumerable
            .Range(0, 10)
            .Select(i =>
            {
                var publicId = Guid.NewGuid();
                var shortId = publicId.ToString()[..8];

                var user = new Faker<User>("en")
                    .RuleFor(u => u.PublicId, publicId)
                    .RuleFor(u => u.Slug, slugHelper.GenerateSlug($"pt-{shortId}"))
                    .RuleFor(u => u.Email, $"patient{i}@test.com")
                    .RuleFor(u => u.Username, (_, u) => u.Email)
                    .RuleFor(u => u.FirstName, f => f.Name.FirstName())
                    .RuleFor(u => u.LastName, f => f.Name.LastName())
                    .RuleFor(u => u.Gender, f => f.PickRandom('M', 'F'))
                    .RuleFor(
                        u => u.DateOfBirth,
                        f => LocalDate.FromDateTime(f.Date.Past(30, DateTime.Now.AddYears(-20)))
                    )
                    .RuleFor(u => u.IcNumber, f => GenerateMalaysianIcNumber(f))
                    .RuleFor(u => u.Phone, f => $"+601{f.Random.Number(10_000_000, 99_999_999)}")
                    .RuleFor(u => u.PasswordHash, (_, u) => hasher.HashPassword(u, defaultPassword))
                    .Generate();

                var patient = new Faker<Patient>("en")
                    .RuleFor(p => p.PublicId, Guid.NewGuid())
                    .RuleFor(p => p.Slug, slugHelper.GenerateSlug($"patient-{shortId}"))
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
                            $"+601{f.Random.Number(10_000_000, 99_999_999)}"
                        )
                    )
                    .Generate();

                // UserId resolved in Phase 2 after SaveChangesAsync
                return (user, patient);
            })
            .ToList();

    // ─────────────────────────────────────────────
    // Schedules
    // ─────────────────────────────────────────────

    internal static List<DoctorSchedule> BuildDoctorSchedules(
        List<Doctor> doctors,
        LocalDate today,
        int availableStatusId
    )
    {
        var slots = new (LocalTime Start, LocalTime End)[]
        {
            (new LocalTime(9, 0), new LocalTime(9, 30)),
            (new LocalTime(9, 30), new LocalTime(10, 0)),
            (new LocalTime(10, 0), new LocalTime(10, 30)),
            (new LocalTime(10, 30), new LocalTime(11, 0)),
            (new LocalTime(14, 0), new LocalTime(14, 30)),
            (new LocalTime(14, 30), new LocalTime(15, 0)),
        };

        return
        [
            .. doctors.SelectMany(doctor =>
                // 3 past days + today + 5 future days
                Enumerable
                    .Range(-3, 9)
                    .SelectMany(offset =>
                        slots.Select(slot => new DoctorSchedule
                        {
                            PublicId = Guid.NewGuid(),
                            DoctorId = doctor.Id,
                            StatusId = availableStatusId,
                            Date = today.PlusDays(offset),
                            StartTime = slot.Start,
                            EndTime = slot.End,
                        })
                    )
            ),
        ];
    }

    // ─────────────────────────────────────────────
    // Appointments
    //
    // Returns the new appointments AND the DoctorSchedule entities whose
    // StatusId was mutated, so the caller can mark them modified before saving.
    // ─────────────────────────────────────────────

    internal static (
        List<Appointment> Appointments,
        List<DoctorSchedule> TouchedSchedules
    ) BuildAppointments(
        Faker faker,
        List<Doctor> doctors,
        List<Patient> patients,
        List<DoctorSchedule> schedules,
        User createdByUser,
        Dictionary<string, AppointmentStatus> appointmentStatuses,
        Dictionary<string, ScheduleStatus> scheduleStatuses
    )
    {
        var now = SystemClock.Instance.GetCurrentInstant();
        var today = now.InUtc().Date;

        var bookedStatusId = scheduleStatuses["booked"].Id;
        var completedAppointmentStatusId = appointmentStatuses["completed"].Id;
        var bookedAppointmentStatusId = appointmentStatuses["booked"].Id;
        var cancelledAppointmentStatusId = appointmentStatuses["cancelled"].Id;

        var appointments = new List<Appointment>();
        var touchedSchedules = new List<DoctorSchedule>();

        static Appointment MakeAppointment(
            Guid publicId,
            long patientId,
            long doctorId,
            long scheduleId,
            int statusId,
            long createdById,
            string visitReason,
            NodaTime.Instant? checkIn = null,
            string? cancellationReason = null,
            List<Symptom>? symptoms = null
        ) =>
            new()
            {
                PublicId = publicId,
                Slug = $"apt-{publicId.ToString()[..8]}",
                PatientId = patientId,
                DoctorId = doctorId,
                ScheduleId = scheduleId,
                StatusId = statusId,
                CreatedByUserId = createdById,
                VisitReason = visitReason,
                CheckInDateTime = checkIn,
                CancellationReason = cancellationReason,
                Symptoms = symptoms,
            };

        List<Symptom>[] symptomSets =
        [
            [
                new Symptom
                {
                    Name = "Fever",
                    Severity = "Moderate",
                    Duration = "3 days",
                },
                new Symptom
                {
                    Name = "Cough",
                    Severity = "Mild",
                    Duration = "5 days",
                },
            ],
            [
                new Symptom
                {
                    Name = "Chest pain",
                    Severity = "Severe",
                    Duration = "1 day",
                },
            ],
            [
                new Symptom
                {
                    Name = "Fatigue",
                    Severity = "Mild",
                    Duration = "1 week",
                },
                new Symptom
                {
                    Name = "Headache",
                    Severity = "Moderate",
                    Duration = "2 days",
                },
            ],
            [
                new Symptom
                {
                    Name = "Skin rash",
                    Severity = "Moderate",
                    Duration = "4 days",
                },
            ],
            [
                new Symptom
                {
                    Name = "Nausea",
                    Severity = "Mild",
                    Duration = "2 days",
                },
                new Symptom
                {
                    Name = "Dizziness",
                    Severity = "Mild",
                    Duration = "1 day",
                },
            ],
            [],
        ];

        // Completed (past)
        var pastSchedules = schedules.Where(s => s.Date < today).Take(6).ToList();
        var symptomIndex = 0;

        foreach (var schedule in pastSchedules)
        {
            var publicId = Guid.NewGuid();
            var symptoms = symptomSets[symptomIndex % symptomSets.Length];
            symptomIndex++;

            appointments.Add(
                MakeAppointment(
                    publicId,
                    faker.PickRandom(patients).Id,
                    doctors.First(d => d.Id == schedule.DoctorId).Id,
                    schedule.Id,
                    completedAppointmentStatusId,
                    createdByUser.Id,
                    faker.PickRandom(
                        "Routine checkup",
                        "Follow-up visit",
                        "Chest pain",
                        "Fever and cough",
                        "Skin rash"
                    ),
                    checkIn: now.Minus(NodaTime.Duration.FromDays(faker.Random.Int(1, 3))),
                    symptoms: symptoms.Count > 0 ? symptoms : null
                )
            );

            // Sync: completed slot was booked before it ran
            schedule.StatusId = bookedStatusId;
            touchedSchedules.Add(schedule);
        }

        // Upcoming (booked)
        var upcomingSchedules = schedules.Where(s => s.Date > today).Take(4).ToList();

        foreach (var schedule in upcomingSchedules)
        {
            var publicId = Guid.NewGuid();
            appointments.Add(
                MakeAppointment(
                    publicId,
                    faker.PickRandom(patients).Id,
                    doctors.First(d => d.Id == schedule.DoctorId).Id,
                    schedule.Id,
                    bookedAppointmentStatusId,
                    createdByUser.Id,
                    faker.PickRandom(
                        "Annual health screening",
                        "Blood pressure review",
                        "Diabetes follow-up",
                        "Vaccination"
                    )
                )
            );

            schedule.StatusId = bookedStatusId;
            touchedSchedules.Add(schedule);
        }

        // Cancelled
        var cancelledSchedule = schedules
            .Where(s => s.Date >= today)
            .Skip(upcomingSchedules.Count)
            .FirstOrDefault();

        if (cancelledSchedule is not null)
        {
            var publicId = Guid.NewGuid();
            appointments.Add(
                MakeAppointment(
                    publicId,
                    faker.PickRandom(patients).Id,
                    doctors.First(d => d.Id == cancelledSchedule.DoctorId).Id,
                    cancelledSchedule.Id,
                    cancelledAppointmentStatusId,
                    createdByUser.Id,
                    "General consultation",
                    cancellationReason: "Patient requested cancellation"
                )
            );

            // Cancelled appointment: the slot reverts to available — no status change needed
            // (schedule already seeded as available, so we deliberately skip touching it here)
        }

        return (appointments, touchedSchedules);
    }

    // ─────────────────────────────────────────────
    // Consultations
    // ─────────────────────────────────────────────

    internal static List<Consultation> BuildConsultations(
        Faker faker,
        List<Appointment> appointments,
        SlugHelper slugHelper
    ) =>
        appointments
            .Where(a => a.StatusId == StatusId.Appointment.Completed)
            .Select(appointment =>
            {
                var publicId = Guid.NewGuid();
                var shortId = publicId.ToString()[..8];

                return new Consultation
                {
                    PublicId = publicId,
                    Slug = slugHelper.GenerateSlug($"cons-{shortId}"),
                    AppointmentId = appointment.Id,
                    ConsultationNotes = new ConsultationNote(
                        Subjective: faker.Lorem.Sentence(12),
                        Objective: $"BP: {faker.Random.Number(110, 140)}/{faker.Random.Number(70, 90)}, "
                            + $"HR: {faker.Random.Number(60, 100)}, "
                            + $"Temp: {faker.Random.Double(36.1, 37.5):F1}C",
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

    /// Generates a plausible Malaysian NRIC: YYMMDD-PB-####
    private static string GenerateMalaysianIcNumber(Faker f)
    {
        var dob = f.Date.Past(40, DateTime.Now.AddYears(-18));
        var stateCode = f.PickRandom(StateCodes);
        var sequence = f.Random.Number(1000, 9999);

        return $"{dob:yy}{dob:MM}{dob:dd}{stateCode}{sequence}";
    }
}