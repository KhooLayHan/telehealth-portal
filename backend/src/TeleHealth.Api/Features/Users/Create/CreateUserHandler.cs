using MassTransit;

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

using NodaTime;

using Serilog;

using Slugify;

using TeleHealth.Api.Common.Exceptions.Users;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;
using TeleHealth.Contracts;

namespace TeleHealth.Api.Features.Users.Create;

public class CreateUserHandler(
    ApplicationDbContext db,
    IPasswordHasher<User> passwordHasher,
    IPublishEndpoint publishEndpoint
)
{
    public async Task<Guid> HandleAsync(CreateUserCommand command, CancellationToken token)
    {
        SlugHelper slugHelper = new();

        var existingUser = await db.Users.FirstOrDefaultAsync(
            u => u.Email == command.Email || u.IcNumber == command.IcNumber,
            token
        );

        if (existingUser is not null)
        {
            Log.Warning("Duplicate email registration attempt.");
            throw new DuplicateEmailException();
        }

        var publicId = Guid.NewGuid();
        var userSlug = slugHelper.GenerateSlug($"user-{publicId}");

        await using var transaction = await db.Database.BeginTransactionAsync(token);

        var user = new User
        {
            PublicId = publicId,
            Slug = userSlug,
            Username = command.Username,
            Email = command.Email,
            PasswordHash = string.Empty,
            FirstName = command.FirstName,
            LastName = command.LastName,
            IcNumber = command.IcNumber,
            Gender = command.Gender[0],
            DateOfBirth = command.DateOfBirth,
            Phone = command.Phone,
        };
        user.PasswordHash = passwordHasher.HashPassword(user, command.Password);

        db.Users.Add(user);
        await db.SaveChangesAsync(token);

        var patientPublicId = Guid.NewGuid();
        var patientSlug = slugHelper.GenerateSlug($"patient-{patientPublicId:N}");

        var patient = new Patient
        {
            PublicId = patientPublicId,
            Slug = patientSlug,
            UserId = user.Id,
        };

        db.Patients.Add(patient);
        await db.SaveChangesAsync(token);

        await publishEndpoint.Publish(
            new UserCreatedEvent(user.PublicId, SystemClock.Instance.GetCurrentInstant()),
            token
        );

        await db.SaveChangesAsync(token);

        await transaction.CommitAsync(token);

        return patient.PublicId;
    }
}