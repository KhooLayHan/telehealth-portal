using Bogus;
using Microsoft.AspNetCore.Identity;
using NodaTime;
using Slugify;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Seeding.Fakers;

internal static class DoctorFaker
{
    // All 6 departments — each entry produces one doctor
    private static readonly (string DeptSlug, string Specialization)[] Specializations =
    [
        ("general", "General Practice"),
        ("cardiology", "Cardiology"),
        ("pediatrics", "Pediatrics"),
        ("orthopedics", "Orthopedics"),
        ("dermatology", "Dermatology"),
        ("neurology", "Neurology"),
    ];

    internal static List<(User User, Doctor Doctor)> BuildDoctorUsers(
        Faker faker,
        IPasswordHasher<User> hasher,
        string defaultPassword,
        Dictionary<string, Department> departments,
        SlugHelper slugHelper
    ) =>
        Specializations
            .Select(
                (spec, i) =>
                {
                    var publicId = Guid.NewGuid();
                    var firstName = faker.Name.FirstName();
                    var lastName = faker.Name.LastName();
                    var username =
                        $"dr.{firstName.ToLowerInvariant()}.{lastName.ToLowerInvariant()}{i}";
                    var shortId = publicId.ToString()[..8];

                    var user = new User
                    {
                        PublicId = publicId,
                        Slug = slugHelper.GenerateSlug($"dr-{firstName}-{lastName}-{shortId}"),
                        Email =
                            $"dr.{firstName.ToLowerInvariant()}-{lastName.ToLowerInvariant()}{i}@telehealth.com",
                        Username = username,
                        FirstName = firstName,
                        LastName = lastName,
                        Gender = faker.PickRandom('M', 'F'),
                        DateOfBirth = LocalDate.FromDateTime(
                            faker.Date.Past(20, DateTime.Now.AddYears(-35))
                        ),
                        IcNumber = SeedFakers.GenerateMalaysianIcNumber(faker),
                        Phone = $"+601{faker.Random.Number(10_000_000, 99_999_999)}",
                        PasswordHash = string.Empty,
                    };
                    user.PasswordHash = hasher.HashPassword(user, defaultPassword);

                    var doctor = new Doctor
                    {
                        PublicId = Guid.NewGuid(),
                        Slug = slugHelper.GenerateSlug(
                            $"doc-{firstName}-{lastName}-{faker.Random.AlphaNumeric(4)}"
                        ),
                        DepartmentId = departments[spec.DeptSlug].Id,
                        LicenseNumber = $"MMC-{faker.Random.Number(10_000, 99_999)}",
                        Specialization = spec.Specialization,
                        ConsultationFee = Math.Round(faker.Random.Decimal(80, 200), 2),
                        Bio = faker.Lorem.Paragraph(2),
                        Qualifications =
                        [
                            new Qualification(
                                "MBBS",
                                faker.PickRandom("University Malaya", "UKM", "USM", "UPM", "IMU"),
                                faker.Random.Number(2005, 2015)
                            ),
                            new Qualification(
                                $"Fellowship in {spec.Specialization}",
                                "National Specialist Centre",
                                faker.Random.Number(2016, 2022)
                            ),
                        ],
                        UserId = 0, // resolved in Phase 2 after SaveChangesAsync
                    };

                    return (user, doctor);
                }
            )
            .ToList();
}
