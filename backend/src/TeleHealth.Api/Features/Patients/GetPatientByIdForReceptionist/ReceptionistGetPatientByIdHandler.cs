using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Features.Patients.GetAllPatientsForReceptionist;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Patients.GetPatientByIdForReceptionist;

public sealed class ReceptionistGetPatientByIdHandler(ApplicationDbContext db)
{
    public async Task<ReceptionistPatientsDto?> HandleAsync(
        Guid patientPublicId,
        CancellationToken ct
    )
    {
        var patient = await db
            .Patients.AsNoTracking()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.PublicId == patientPublicId, ct);

        if (patient is null)
            return null;

        return new ReceptionistPatientsDto
        {
            UserPublicId = patient.User.PublicId,
            PatientPublicId = patient.PublicId,
            Slug = patient.Slug,
            FirstName = patient.User.FirstName,
            LastName = patient.User.LastName,
            AvatarUrl = patient.User.AvatarUrl,
            PatientEmail = patient.User.Email,
            DateOfBirth = patient.User.DateOfBirth,
            PhoneNumber = patient.User.Phone ?? string.Empty,
            IcNumber = patient.User.IcNumber,
            BloodGroup = patient.BloodGroup ?? string.Empty,
            Allergies = patient.Allergies,
            EmergencyContacts =
                patient.EmergencyContact != null ? [patient.EmergencyContact] : null,
        };
    }
}
