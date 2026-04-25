using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Patients;
using TeleHealth.Api.Features.Patients.GetAllPatientsForClinicStaff;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Patients.UpdatePatientRecord;

public sealed class UpdatePatientRecordHandler(ApplicationDbContext db)
{
    public async Task<ClinicStaffPatientDto> HandleAsync(
        Guid patientPublicId,
        UpdatePatientRecordCommand cmd,
        CancellationToken ct
    )
    {
        Log.Information(
            "Attempting to update patient record. PatientId: {PatientId}",
            patientPublicId
        );

        var patient = await db
            .Patients.Include(p => p.User)
            .FirstOrDefaultAsync(p => p.PublicId == patientPublicId, ct);

        if (patient is null)
        {
            Log.Warning("Patient not found. PatientId: {PatientId}", patientPublicId);
            throw new PatientNotFoundException();
        }

        var now = SystemClock.Instance.GetCurrentInstant();

        patient.User.FirstName = cmd.FirstName;
        patient.User.LastName = cmd.LastName;
        patient.User.DateOfBirth = cmd.DateOfBirth;
        patient.User.Phone = cmd.PhoneNumber;
        patient.User.Gender = cmd.Gender;
        patient.User.UpdatedAt = now;

        patient.BloodGroup = cmd.BloodGroup;
        patient.EmergencyContact = cmd.EmergencyContact;
        patient.Allergies = cmd.Allergies;
        patient.UpdatedAt = now;

        await db.SaveChangesAsync(ct);

        Log.Information(
            "Successfully updated patient record. PatientId: {PatientId}",
            patientPublicId
        );

        return ClinicStaffPatientDto.FromEntity(patient);
    }
}
