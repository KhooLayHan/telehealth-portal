using Microsoft.EntityFrameworkCore;
using NodaTime;
using Npgsql;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Patients;
using TeleHealth.Api.Common.Exceptions.Users;
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

        var hasDuplicateUsername =
            !string.Equals(patient.User.Username, cmd.Username, StringComparison.Ordinal)
            && await db.Users.AnyAsync(
                u =>
                    u.Username == cmd.Username
                    && u.PublicId != patient.User.PublicId
                    && u.DeletedAt == null,
                ct
            );

        if (hasDuplicateUsername)
        {
            throw new DuplicateUsernameException();
        }

        var hasDuplicateEmail =
            !string.Equals(patient.User.Email, cmd.Email, StringComparison.Ordinal)
            && await db.Users.AnyAsync(
                u =>
                    u.Email == cmd.Email
                    && u.PublicId != patient.User.PublicId
                    && u.DeletedAt == null,
                ct
            );

        if (hasDuplicateEmail)
        {
            throw new DuplicateEmailException();
        }

        var hasDuplicateIcNumber =
            !string.Equals(patient.User.IcNumber, cmd.IcNumber, StringComparison.Ordinal)
            && await db.Users.AnyAsync(
                u =>
                    u.IcNumber == cmd.IcNumber
                    && u.PublicId != patient.User.PublicId
                    && u.DeletedAt == null,
                ct
            );

        if (hasDuplicateIcNumber)
        {
            throw new DuplicateIcNumberException();
        }

        var now = SystemClock.Instance.GetCurrentInstant();

        patient.User.FirstName = cmd.FirstName;
        patient.User.LastName = cmd.LastName;
        patient.User.Username = cmd.Username;
        patient.User.Email = cmd.Email;
        patient.User.IcNumber = cmd.IcNumber;
        patient.User.DateOfBirth = cmd.DateOfBirth;
        patient.User.Phone = cmd.PhoneNumber;
        patient.User.Gender = cmd.Gender;
        patient.User.UpdatedAt = now;

        patient.BloodGroup = cmd.BloodGroup;
        patient.EmergencyContact = cmd.EmergencyContact;
        patient.Allergies = cmd.Allergies;
        patient.UpdatedAt = now;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is PostgresException pg
                && pg.SqlState == PostgresErrorCodes.UniqueViolation
            )
        {
            if (pg.ConstraintName == "uq_users_username_active")
            {
                throw new DuplicateUsernameException();
            }

            if (pg.ConstraintName == "uq_users_email_active")
            {
                throw new DuplicateEmailException();
            }

            if (pg.ConstraintName == "uq_users_ic_active")
            {
                throw new DuplicateIcNumberException();
            }

            throw;
        }

        Log.Information(
            "Successfully updated patient record. PatientId: {PatientId}",
            patientPublicId
        );

        return ClinicStaffPatientDto.FromEntity(patient);
    }
}
