using MassTransit;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using Slugify;
using TeleHealth.Api.Common.Exceptions;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;
using TeleHealth.Contracts;

namespace TeleHealth.Api.Features.Users.Register;

public sealed class RegisterPatientHandler(
    ApplicationDbContext db,
    IPasswordHasher<User> passwordHasher,
    IPublishEndpoint publishEndpoint
)
{
    public async Task<Guid> HandleAsync(RegisterPatientCommand cmd, CancellationToken ct)
    {
        Log.Information("Attempting to register new patient.");

        SlugHelper slugHelper = new();

        var usernameExists = await db.Users.AnyAsync(u => u.Username == cmd.Username, ct);
        if (usernameExists)
        {
            throw new ConflictException("Username is already registered.");
        }

        var emailExists = await db.Users.AnyAsync(u => u.Email == cmd.Email, ct);
        if (emailExists)
        {
            throw new ConflictException("Email is already registered.");
        }

        var icExists = await db.Users.AnyAsync(u => u.IcNumber == cmd.IcNumber, ct);
        if (icExists)
        {
            throw new ConflictException("IC Number is already registered.");
        }

        var patientRole = await db.Roles.SingleAsync(r => r.Slug == "patient", ct);

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        var publicId = Guid.NewGuid();
        var userSlug = slugHelper.GenerateSlug($"{cmd.FirstName}-{cmd.LastName}-{publicId}");

        var user = new User
        {
            PublicId = publicId,
            Slug = userSlug,
            Username = cmd.Username,
            Email = cmd.Email,
            PasswordHash = string.Empty,
            FirstName = cmd.FirstName,
            LastName = cmd.LastName,
            IcNumber = cmd.IcNumber,
            Gender = cmd.Gender,
            DateOfBirth = cmd.DateOfBirth,
            Roles = { patientRole },
        };
        user.PasswordHash = passwordHasher.HashPassword(user, cmd.Password);

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        var patient = new Patient
        {
            PublicId = Guid.NewGuid(),
            Slug = slugHelper.GenerateSlug($"patient-{userSlug}"),
            UserId = user.Id,
        };

        db.Patients.Add(patient);

        await publishEndpoint.Publish(
            new PatientRegisteredEvent(user.PublicId, SystemClock.Instance.GetCurrentInstant()),
            ct
        );

        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        Log.Information("Successfully registered Patient {PublicId}", patient.PublicId);

        return patient.PublicId;
    }
}
