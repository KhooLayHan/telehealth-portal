using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Serilog;
using Slugify;
using TeleHealth.Api.Common.Exceptions.Users;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Features.Admins.GetAllLabTechs;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Admins.CreateLabTech;

// Handles creation of lab technician users and assigns the lab technician role.
public sealed class AdminCreateLabTechHandler(
    ApplicationDbContext db,
    IPasswordHasher<User> passwordHasher
)
{
    private const string LabTechSlug = "lab-tech";

    // Creates a user account and returns the admin lab technician list DTO.
    public async Task<AdminLabTechDto> HandleAsync(
        AdminCreateLabTechCommand cmd,
        CancellationToken ct
    )
    {
        Log.Information("Attempting to create a new lab technician.");

        var labTechRole =
            await db.Roles.SingleOrDefaultAsync(r => r.Slug == LabTechSlug, ct)
            ?? throw new InvalidOperationException(
                "Required 'lab-tech' role is not configured in the system."
            );

        SlugHelper slugHelper = new();
        var publicId = Guid.NewGuid();

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
            Phone = cmd.PhoneNumber,
            Address = cmd.Address,
            Roles = { labTechRole },
        };
        user.PasswordHash = passwordHasher.HashPassword(user, cmd.Password);

        db.Users.Add(user);

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

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

        await transaction.CommitAsync(ct);

        Log.Information("Successfully created lab technician. LabTechId: {LabTechId}", publicId);

        return new AdminLabTechDto
        {
            PublicId = user.PublicId,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Username = user.Username,
            Email = user.Email,
            PhoneNumber = user.Phone,
            Slug = user.Slug,
            Gender = user.Gender,
            DateOfBirth = user.DateOfBirth,
            AvatarUrl = user.AvatarUrl,
            Address = user.Address,
            CreatedAt = user.CreatedAt,
            DeletedAt = user.DeletedAt,
        };
    }
}
