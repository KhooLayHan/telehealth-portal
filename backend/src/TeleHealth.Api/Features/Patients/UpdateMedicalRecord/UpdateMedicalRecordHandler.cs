using Microsoft.EntityFrameworkCore;

using NodaTime;

using TeleHealth.Api.Features.Patients.UpdateMedicalInfo;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Patients.UpdateMedicalRecord;

public sealed class UpdateMedicalRecordHandler(ApplicationDbContext db)
{
    public async Task<bool> HandleAsync(
        Guid userPublicId,
        UpdateMedicalRecordCommand cmd,
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
        patient.UpdatedAt = SystemClock.Instance.GetCurrentInstant();

        await db.SaveChangesAsync(ct);

        return true;
    }
}
