using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Users.Register;

public sealed class RegisterPatientHandler(ApplicationDbContext db, IPasswordHasher<User> passwordHasher)
{
    public async Task<Guid> HandleAsync(RegisterPatientCommand command, CancellationToken token)
    {
        var existingUser = await db.Users.FirstOrDefaultAsync(u => u.Email == command.Email || u.IcNumber == command.IcNumber, token);

        if (existingUser is not null)
        {
            throw new InvalidOperationException("User with this email already exists.");
        }

        var publicId = Guid.NewGuid();
        var userSlug = $"";
        
        var user = new User
        {
            PublicId = publicId,
            Slug = userSlug,
            Username = command.Email, 
            Email = command.Email,
            PasswordHash = passwordHasher.HashPassword(null!, command.Password),
            FirstName = command.FirstName,
            LastName = command.LastName,
            IcNumber = command.IcNumber,
            Gender = command.Gender,
            DateOfBirth = command.DateOfBirth
        };

        var patient = new Patient
        {
            PublicId = Guid.NewGuid(),
            Slug = $"patient-{userSlug}",
            UserId = user.Id,
        };
        
        db.Users.Add(user);
        db.Patients.Add(patient);
        
        // TODO: Outbox Message Pattern
        // db.OutboxMessages.Add(outboxEvent);
        
        await db.SaveChangesAsync(token);
        
        return patient.PublicId;
    }
}