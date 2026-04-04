using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Patients.UpdateMedicalInfo;

public sealed class UpdateMedicalInfoHandler(ApplicationDbContext db)
{
    public async Task<bool> HandleAsync(
        Guid userPublicId,
        UpdateMedicalInfoCommand cmd,
        CancellationToken ct
    )
    {
        var patient = await db
            .Patients.Include(p => p.User)
            .FirstOrDefaultAsync(p => p.User.PublicId == userPublicId, ct);

        if (patient is null)
            return false;

        patient.BloodGroup = cmd.BloodGroup;
        patient.EmergencyContact = cmd.EmergencyContact;
        patient.Allergies = cmd.Allergies;

        await db.SaveChangesAsync(ct);

        return true;
    }
}
