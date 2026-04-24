using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Patients.UpdatePatientRecord;

public sealed record UpdatePatientRecordCommand(
    string FirstName,
    string LastName,
    LocalDate DateOfBirth,
    string? PhoneNumber,
    char Gender,
    string? BloodGroup,
    EmergencyContact? EmergencyContact,
    List<Allergy> Allergies
) { }
