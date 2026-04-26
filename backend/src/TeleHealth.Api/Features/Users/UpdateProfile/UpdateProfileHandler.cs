using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Users;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Users.UpdateProfile;

public sealed record UpdateProfileResult(
    string FirstName,
    string LastName,
    string? Phone,
    string IcNumber,
    string? Address
);

public sealed class UpdateProfileHandler(ApplicationDbContext db)
{
    public async Task<UpdateProfileResult> HandleAsync(
        Guid publicId,
        UpdateProfileCommand cmd,
        CancellationToken ct
    )
    {
        Log.Information("Updating profile. UserId: {UserId}", publicId);

        var user = await db.Users.FirstOrDefaultAsync(u => u.PublicId == publicId, ct);

        if (user is null)
            throw new UserNotFoundException(publicId);

        if (
            !string.Equals(user.IcNumber, cmd.IcNumber, StringComparison.Ordinal)
            && await db.Users.AnyAsync(
                u => u.IcNumber == cmd.IcNumber && u.PublicId != publicId && u.DeletedAt == null,
                ct
            )
        )
        {
            throw new DuplicateIcNumberException();
        }

        user.FirstName = cmd.FirstName;
        user.LastName = cmd.LastName;
        user.Phone = string.IsNullOrEmpty(cmd.Phone) ? null : cmd.Phone;
        user.IcNumber = cmd.IcNumber;
        user.Address = string.IsNullOrEmpty(cmd.Address)
            ? null
            : new Address(cmd.Address, "-", "-", "-", "-");
        user.UpdatedAt = SystemClock.Instance.GetCurrentInstant();

        await db.SaveChangesAsync(ct);

        Log.Information("Profile update successful. UserId: {UserId}", publicId);

        return new UpdateProfileResult(
            user.FirstName,
            user.LastName,
            user.Phone,
            user.IcNumber,
            user.Address?.Street
        );
    }
}
