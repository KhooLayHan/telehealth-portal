using Facet.Extensions;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Features.Patients.GetProfile;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Patients.UpdateMedicalRecord;

public sealed class UpdateMedicalRecordHandler(ApplicationDbContext db)
{
    public async Task<PatientProfileDto?> HandleAsync(
        Guid userPublicId,
        UpdateMedicalRecordCommand cmd,
        CancellationToken ct
    )
    {
        var patient = await db
            .Patients.Include(p => p.User)
            .FirstOrDefaultAsync(p => p.User.PublicId == userPublicId, ct);

        if (patient is null)
            return null;

        patient.BloodGroup = cmd.BloodGroup;
        patient.EmergencyContact = cmd.EmergencyContact;
        patient.Allergies = cmd.Allergies;
        patient.UpdatedAt = SystemClock.Instance.GetCurrentInstant();

        await db.SaveChangesAsync(ct);

        return await db
            .Patients.AsNoTracking()
            .Where(p => p.User.PublicId == userPublicId)
            .SelectFacet<Patient, PatientProfileDto>()
            .FirstOrDefaultAsync(ct);
    }
}
