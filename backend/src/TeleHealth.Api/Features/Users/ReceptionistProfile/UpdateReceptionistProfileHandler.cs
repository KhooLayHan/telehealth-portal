using Microsoft.EntityFrameworkCore;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Users;
using TeleHealth.Api.Features.Users.UpdateProfile;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Users.ReceptionistProfile;

public sealed class UpdateReceptionistProfileHandler(ApplicationDbContext db)
{
    public async Task<UpdateProfileResult> HandleAsync(
        Guid publicId,
        UpdateProfileCommand cmd,
        CancellationToken ct
    )
    {
        Log.Information("Updating receptionist profile. UserId: {UserId}", publicId);

        var currentIcNumber = await db
            .Users.AsNoTracking()
            .Where(u => u.PublicId == publicId)
            .Select(u => (string?)u.IcNumber)
            .FirstOrDefaultAsync(ct);

        if (currentIcNumber is null)
            throw new UserNotFoundException(publicId);

        if (
            !string.Equals(currentIcNumber, cmd.IcNumber, StringComparison.Ordinal)
            && await db.Users.AnyAsync(
                u => u.IcNumber == cmd.IcNumber && u.PublicId != publicId && u.DeletedAt == null,
                ct
            )
        )
        {
            throw new DuplicateIcNumberException();
        }

        var phone = string.IsNullOrEmpty(cmd.Phone) ? null : cmd.Phone;

        await db.Database.ExecuteSqlInterpolatedAsync(
            $"""
            UPDATE users
            SET
                first_name = {cmd.FirstName},
                last_name  = {cmd.LastName},
                phone      = {phone},
                ic_number  = {cmd.IcNumber},
                updated_at = now()
            WHERE public_id  = {publicId}
              AND deleted_at IS NULL
            """,
            ct
        );

        Log.Information("Receptionist profile update successful. UserId: {UserId}", publicId);

        return new UpdateProfileResult(cmd.FirstName, cmd.LastName, phone, cmd.IcNumber, null);
    }
}
