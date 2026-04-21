using System.Linq.Expressions;
using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Patients.GetAllPatientsForClinicStaff;

public sealed record AllergyDto(string Allergen, string Severity, string Reaction);

public sealed record EmergencyContactDto(string Name, string Relationship, string Phone);

public sealed record ClinicStaffPatientDto(
    Guid PatientPublicId,
    string Slug,
    string FirstName,
    string LastName,
    string FullName,
    LocalDate DateOfBirth,
    string PhoneNumber,
    string BloodGroup,
    char? Gender,
    List<AllergyDto>? Allergies,
    List<EmergencyContactDto>? EmergencyContacts
)
{
    public static Expression<Func<Patient, ClinicStaffPatientDto>> Projection =>
        p => new ClinicStaffPatientDto(
            p.PublicId,
            p.User.Slug,
            p.User.FirstName ?? string.Empty,
            p.User.LastName ?? string.Empty,
            $"{p.User.FirstName} {p.User.LastName}",
            p.User.DateOfBirth,
            p.User.Phone ?? string.Empty,
            p.BloodGroup ?? string.Empty,
            p.User.Gender,
            p.Allergies.Select(a => new AllergyDto(a.Allergen, a.Severity, a.Reaction)).ToList()
                ?? new(),
            p.EmergencyContact.Select(e => new EmergencyContactDto(e.Name, e.Relationship, e.Phone))
                .ToList()
                ?? new()
        );
}
