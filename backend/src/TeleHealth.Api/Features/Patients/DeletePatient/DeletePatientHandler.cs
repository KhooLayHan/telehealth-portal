using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Patients;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Patients.DeletePatient;

public sealed class DeletePatientHandler(ApplicationDbContext db)
{
    public async Task HandleAsync(Guid patientPublicId, CancellationToken ct)
    {
        var patient = await db
            .Patients.Include(p => p.User)
            .FirstOrDefaultAsync(p => p.PublicId == patientPublicId, ct);

        if (patient is null)
        {
            Log.Warning("Patient not found. PatientPublicId: {PatientPublicId}", patientPublicId);
            throw new PatientNotFoundException();
        }

        var now = SystemClock.Instance.GetCurrentInstant();

        patient.DeletedAt = now;
        patient.User.DeletedAt = now;

        await db.SaveChangesAsync(ct);

        Log.Information(
            "Patient soft-deleted. PatientPublicId: {PatientPublicId}",
            patientPublicId
        );
    }
}
