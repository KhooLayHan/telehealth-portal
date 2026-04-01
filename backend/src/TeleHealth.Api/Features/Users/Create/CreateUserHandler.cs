using MassTransit;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Users.CreateUser;

public class CreateUserHandler(
    ApplicationDbContext db,
    IPasswordHasher<User> passwordHasher,
    IPublishEndpoint publishEndpoint
)
{
    public async Task<Guid> HandleAsync(CreateUserCommand command, CancellationToken token)
    {
        var existingUser = await db.Users.FirstOrDefaultAsync(
            u => u.Email == command.Email || u.IcNumber == command.IcNumber,
            token
        );

        if (existingUser is not null)
        {
            throw new InvalidOperationException("User with this email already exists.");
        }

        var publicId = Guid.NewGuid();
        var patientPublicId = Guid.NewGuid();
        var userSlug = $"user-{publicId:N}";

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

        var patient = new Patient
        {
            PublicId = patientPublicId,
            Slug = $"patient-{patientPublicId:N}",
            UserId = user.Id,
        };

        db.Patients.Add(patient);
        await db.SaveChangesAsync(token);

        await publishEndpoint.Publish(
            new UserCreatedEvent(user.PublicId, user.Username, user.Email),
            token
        );

        await transaction.CommitAsync(token);

        return patient.PublicId;
    }
}

public record UserCreatedEvent(Guid UserPublicId, string Username, string Email);
