using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Npgsql;
using Serilog;
using Slugify;
using TeleHealth.Api.Common.Exceptions.Users;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Doctors.CreateDoctor;

public sealed class CreateDoctorHandler(
    ApplicationDbContext db,
    IPasswordHasher<User> passwordHasher
)
{
    public async Task<Guid> HandleAsync(CreateDoctorCommand cmd, CancellationToken ct)
    {
        Log.Information("Attempting to create new doctor.");

        SlugHelper slugHelper = new();

        var doctorRole =
            await db.Roles.SingleOrDefaultAsync(r => r.Slug == "doctor", ct)
            ?? throw new InvalidOperationException(
                "Required 'doctor' role is not configured in the system."
            );

        // Resolve or create department by name
        var department = await db.Departments.FirstOrDefaultAsync(
            d => d.Name == cmd.DepartmentName,
            ct
        );

        if (department is null)
        {
            department = new Department
            {
                Slug = slugHelper.GenerateSlug(cmd.DepartmentName),
                Name = cmd.DepartmentName,
            };
            db.Departments.Add(department);
            await db.SaveChangesAsync(ct);
        }

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        var userPublicId = Guid.NewGuid();

        var user = new User
        {
            PublicId = userPublicId,
            Slug = slugHelper.GenerateSlug($"user-{userPublicId:N}"),
            Username = cmd.Username,
            Email = cmd.Email,
            PasswordHash = string.Empty,
            FirstName = cmd.FirstName,
            LastName = cmd.LastName,
            IcNumber = cmd.IcNumber,
            Gender = cmd.Gender[0],
            DateOfBirth = cmd.DateOfBirth,
            Phone = cmd.PhoneNumber,
            Address = cmd.Address is { } addr
                ? new Address(addr.Street, addr.City, addr.State, addr.PostalCode, addr.Country)
                : null,
            Roles = { doctorRole },
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
                _ => new UserAlreadyExistsException(),
            };
        }

        var doctorPublicId = Guid.NewGuid();

        var doctor = new Doctor
        {
            PublicId = doctorPublicId,
            Slug = slugHelper.GenerateSlug($"doctor-{doctorPublicId:N}"),
            UserId = user.Id,
            DepartmentId = department.Id,
            LicenseNumber = cmd.LicenseNumber,
            Specialization = cmd.Specialization,
            ConsultationFee = cmd.ConsultationFee,
            Bio = cmd.Bio,
            CreatedAt = SystemClock.Instance.GetCurrentInstant(),
            Qualifications = cmd
                .Qualifications.Select(q => new Qualification(q.Degree, q.Institution, q.Year))
                .ToList(),
        };

        db.Doctors.Add(doctor);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        Log.Information("Doctor created. DoctorPublicId: {DoctorPublicId}", doctorPublicId);

        return doctorPublicId;
    }
}
