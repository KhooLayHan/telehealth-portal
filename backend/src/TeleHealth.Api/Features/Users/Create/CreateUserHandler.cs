using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Users.CreateUser;

public class CreateUserHandler(ApplicationDbContext db, IPasswordHasher<User> passwordHasher)
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

        var user = new User
        {
            PublicId = publicId,
            Slug = userSlug,
            Username = command.Username,
            Email = command.Email,
            PasswordHash = passwordHasher.HashPassword(null!, command.Password),
            FirstName = command.FirstName,
            LastName = command.LastName,
            IcNumber = command.IcNumber,
            Gender = command.Gender,
            DateOfBirth = command.DateOfBirth,
        };

        var patient = new Patient
        {
            PublicId = patientPublicId,
            +            Slug = $"patient-{patientPublicId:N}",
            PublicId = Guid.NewGuid(),
            Slug = $"patient-{userSlug}",
            UserId = user.Id,
        };

        db.Users.Add(user);
        db.Patients.Add(patient);

        await db.SaveChangesAsync(token);

        return patient.PublicId;
    }
}
