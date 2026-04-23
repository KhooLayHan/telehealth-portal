using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Users;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Admins.DeleteReceptionist;

public sealed class AdminDeleteReceptionistHandler(ApplicationDbContext db)
{
    private const string ReceptionistSlug = "receptionist";

    public async Task HandleAsync(Guid receptionistPublicId, CancellationToken ct)
    {
        Log.Information(
            "Attempting to deactivate receptionist. ReceptionistId: {ReceptionistId}",
            receptionistPublicId
        );

        var user = await db
            .Users.Include(u => u.Roles)
            .FirstOrDefaultAsync(
                u =>
                    u.PublicId == receptionistPublicId
                    && u.Roles.Any(r => r.Slug == ReceptionistSlug),
                ct
            );

        if (user is null)
        {
            throw new UserNotFoundException(receptionistPublicId);
        }

        user.DeletedAt = SystemClock.Instance.GetCurrentInstant();

        await db.SaveChangesAsync(ct);

        Log.Information(
            "Receptionist deactivated successfully. ReceptionistId: {ReceptionistId}",
            receptionistPublicId
        );
    }
}
