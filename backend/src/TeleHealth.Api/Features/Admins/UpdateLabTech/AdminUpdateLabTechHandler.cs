using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Users;
using TeleHealth.Api.Features.Admins.GetAllLabTechs;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Admins.UpdateLabTech;

// Finds the lab technician by public ID, applies editable field changes, and persists them.
public sealed class AdminUpdateLabTechHandler(ApplicationDbContext db)
{
    private const string LabTechSlug = "lab-tech";

    public async Task<AdminLabTechDto> HandleAsync(
        Guid labTechPublicId,
        AdminUpdateLabTechCommand cmd,
        CancellationToken ct
    )
    {
        Log.Information(
            "Attempting to update lab technician. LabTechId: {LabTechId}",
            labTechPublicId
        );

        var user = await db
            .Users.Include(u => u.Roles)
            .FirstOrDefaultAsync(
                u => u.PublicId == labTechPublicId && u.Roles.Any(r => r.Slug == LabTechSlug),
                ct
            );

        if (user is null)
        {
            throw new UserNotFoundException(labTechPublicId);
        }

        var hasDuplicateIcNumber =
            !string.Equals(user.IcNumber, cmd.IcNumber, StringComparison.Ordinal)
            && await db.Users.AnyAsync(
                u =>
                    u.IcNumber == cmd.IcNumber
                    && u.PublicId != user.PublicId
                    && u.DeletedAt == null,
                ct
            );

        if (hasDuplicateIcNumber)
        {
            throw new DuplicateIcNumberException();
        }

        user.FirstName = cmd.FirstName;
        user.LastName = cmd.LastName;
        user.Username = cmd.Username;
        user.Email = cmd.Email;
        user.IcNumber = cmd.IcNumber;
        user.Phone = cmd.PhoneNumber;
        user.Gender = cmd.Gender;
        user.DateOfBirth = cmd.DateOfBirth;
        user.Address = cmd.Address;
        user.UpdatedAt = SystemClock.Instance.GetCurrentInstant();

        await db.SaveChangesAsync(ct);

        Log.Information(
            "Lab technician update successful. LabTechId: {LabTechId}",
            labTechPublicId
        );

        return new AdminLabTechDto
        {
            PublicId = user.PublicId,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Username = user.Username,
            Email = user.Email,
            PhoneNumber = user.Phone,
            Slug = user.Slug,
            IcNumber = user.IcNumber,
            Gender = user.Gender,
            DateOfBirth = user.DateOfBirth,
            AvatarUrl = user.AvatarUrl,
            Address = user.Address,
            CreatedAt = user.CreatedAt,
            DeletedAt = user.DeletedAt,
        };
    }
}
