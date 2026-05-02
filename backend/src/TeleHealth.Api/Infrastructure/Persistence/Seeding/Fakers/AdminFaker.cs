using Bogus;
using Microsoft.AspNetCore.Identity;
using NodaTime;
using Slugify;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Seeding.Fakers;

internal static class AdminFaker
{
    internal static List<User> BuildAdminUsers(
        Faker faker,
        IPasswordHasher<User> hasher,
        string defaultPassword,
        SlugHelper slugHelper
    ) =>
        Enumerable
            .Range(0, 2)
            .Select(i =>
            {
                var publicId = Guid.NewGuid();
                var firstName = faker.Name.FirstName();
                var lastName = faker.Name.LastName();

                var user = new User
                {
                    PublicId = publicId,
                    Slug = slugHelper.GenerateSlug(
                        $"admin-{firstName}-{lastName}-{publicId.ToString()[..8]}"
                    ),
                    Email = $"admin{i}@telehealth.com",
                    Username = $"admin{i}",
                    FirstName = firstName,
                    LastName = lastName,
                    Gender = faker.PickRandom('M', 'F'),
                    DateOfBirth = LocalDate.FromDateTime(
                        faker.Date.Past(20, DateTime.Now.AddYears(-30))
                    ),
                    IcNumber = SeedFakers.GenerateMalaysianIcNumber(faker),
                    Phone = $"+601{faker.Random.Number(10_000_000, 99_999_999)}",
                    PasswordHash = string.Empty,
                };
                user.PasswordHash = hasher.HashPassword(user, defaultPassword);
                return user;
            })
            .ToList();
}
