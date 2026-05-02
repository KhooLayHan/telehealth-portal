using Bogus;
using Microsoft.AspNetCore.Identity;
using NodaTime;
using Slugify;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Seeding.Fakers;

internal static class PatientFaker
{
    internal static List<(User User, Patient Patient)> BuildPatientUsers(
        Faker faker,
        IPasswordHasher<User> hasher,
        string defaultPassword,
        SlugHelper slugHelper
    ) =>
        Enumerable
            .Range(0, 50)
            .Select(i =>
            {
                var publicId = Guid.NewGuid();
                var shortId = publicId.ToString()[..8];

                var user = new User
                {
                    PublicId = publicId,
                    Slug = slugHelper.GenerateSlug($"pt-{shortId}"),
                    Email = $"patient{i}@test.com",
                    Username = $"patient{i}@test.com",
                    FirstName = faker.Name.FirstName(),
                    LastName = faker.Name.LastName(),
                    Gender = faker.PickRandom('M', 'F'),
                    DateOfBirth = LocalDate.FromDateTime(
                        faker.Date.Past(30, DateTime.Now.AddYears(-20))
                    ),
                    IcNumber = SeedFakers.GenerateMalaysianIcNumber(faker),
                    Phone = $"+601{faker.Random.Number(10_000_000, 99_999_999)}",
                    PasswordHash = string.Empty,
                };
                user.PasswordHash = hasher.HashPassword(user, defaultPassword);

                var patient = new Patient
                {
                    PublicId = Guid.NewGuid(),
                    Slug = slugHelper.GenerateSlug($"patient-{shortId}"),
                    BloodGroup = faker.PickRandom("A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"),
                    Allergies = faker.Random.Bool(0.4f)
                        ?
                        [
                            new Allergy(
                                faker.PickRandom(
                                    "Penicillin",
                                    "Shellfish",
                                    "Peanuts",
                                    "Dust Mites",
                                    "Latex"
                                ),
                                faker.PickRandom("mild", "moderate", "severe"),
                                faker.PickRandom("Hives", "Sneezing", "Anaphylaxis", "Rash")
                            ),
                        ]
                        : null,
                    EmergencyContact = new EmergencyContact(
                        faker.Name.FullName(),
                        faker.PickRandom("Spouse", "Parent", "Sibling", "Child"),
                        $"+601{faker.Random.Number(10_000_000, 99_999_999)}"
                    ),
                    UserId = 0, // resolved in Phase 2 after SaveChangesAsync
                };

                return (user, patient);
            })
            .ToList();
}
