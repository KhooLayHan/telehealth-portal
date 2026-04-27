using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Users;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Admins.DeleteLabTech;

// Handles soft-deactivation of lab technician accounts by public ID.
public sealed class AdminDeleteLabTechHandler(ApplicationDbContext db)
{
    private const string LabTechSlug = "lab-tech";

    // Finds the lab technician user, marks it deleted, and saves the change.
    public async Task HandleAsync(Guid labTechPublicId, CancellationToken ct)
    {
        Log.Information(
            "Attempting to deactivate lab technician. LabTechId: {LabTechId}",
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

        user.DeletedAt = SystemClock.Instance.GetCurrentInstant();

        await db.SaveChangesAsync(ct);

        Log.Information(
            "Lab technician deactivated successfully. LabTechId: {LabTechId}",
            labTechPublicId
        );
    }
}
