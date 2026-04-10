using Facet.Extensions;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Patients;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Features.Patients.GetProfile;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Patients.UpdateMedicalRecord;

public sealed class UpdateMedicalRecordHandler(ApplicationDbContext db)
{
    public async Task<PatientProfileDto> HandleAsync(
        Guid userPublicId,
        UpdateMedicalRecordCommand cmd,
        CancellationToken ct
    )
    {
        Log.Information("Attempting to update patient's {PublicId} medical record.", userPublicId);

        var patient = await db
            .Patients.Include(p => p.User)
            .FirstOrDefaultAsync(p => p.User.PublicId == userPublicId, ct);

        if (patient is null)
        {
            Log.Warning("Patient not found. PatientId: {PatientId}", userPublicId);
            throw new PatientNotFoundException();
        }

        patient.BloodGroup = cmd.BloodGroup;
        patient.EmergencyContact = cmd.EmergencyContact;
        patient.Allergies = cmd.Allergies;
        patient.UpdatedAt = SystemClock.Instance.GetCurrentInstant();

        await db.SaveChangesAsync(ct);

        Log.Information("Updating Patient {PublicId} was successful.", patient.PublicId);

        return await db
                .Patients.AsNoTracking()
                .Where(p => p.User.PublicId == userPublicId)
                .Select(PatientProfileDto.Projection)
                .FirstOrDefaultAsync(ct)
            ?? throw new PatientNotFoundException();
    }
}
