using Amazon.CloudWatchLogs.Model;

using MassTransit;

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

using NodaTime;

using Npgsql;

using Serilog;

using Slugify;

using TeleHealth.Api.Common.Exceptions;
using TeleHealth.Api.Common.Exceptions.Users;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;
using TeleHealth.Contracts;

using InvalidOperationException = System.InvalidOperationException;

namespace TeleHealth.Api.Features.Users.Register;

public sealed class RegisterPatientHandler(
    ApplicationDbContext db,
    IPasswordHasher<User> passwordHasher,
    IPublishEndpoint publishEndpoint
)
{
    public async Task<RegisterPatientResult> HandleAsync(
        RegisterPatientCommand cmd,
        CancellationToken ct
    )
    {
        Log.Information("Attempting to register new patient.");

        SlugHelper slugHelper = new();

        var patientRole =
            await db.Roles.SingleOrDefaultAsync(r => r.Slug == "patient", ct)
            ?? throw new InvalidOperationException(
                "Required 'patient' role is not configured in the system."
            );

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        var publicId = Guid.NewGuid();
        var patientPublicId = Guid.NewGuid();

        var user = new User
        {
            PublicId = publicId,
            Slug = slugHelper.GenerateSlug($"user-{publicId:N}"),
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

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is PostgresException pg
                && pg.SqlState == PostgresErrorCodes.UniqueViolation
            )
        {
            await transaction.RollbackAsync(ct);

            throw pg.ConstraintName switch
            {
                "uq_users_username_active" => new DuplicateUsernameException(),
                "uq_users_email_active" => new DuplicateEmailException(),
                "uq_users_ic_active" => new DuplicateIcNumberException(),
                "uq_users_slug_active" => new UserAlreadyExistsException(),
                _ => new UserAlreadyExistsException(),
            };
        }

        var patient = new Patient
        {
            PublicId = patientPublicId,
            Slug = slugHelper.GenerateSlug($"patient-{patientPublicId:N}"),
            UserId = user.Id,
        };

        db.Patients.Add(patient);

        await publishEndpoint.Publish(
            new PatientRegisteredEvent(patient.PublicId, SystemClock.Instance.GetCurrentInstant()),
            ct
        );

        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        Log.Information("Successfully registered Patient {PublicId}", patient.PublicId);

        return new RegisterPatientResult(publicId, patientPublicId);
    }
}

public sealed record RegisterPatientResult(Guid UserPublicId, Guid PatientPublicId);