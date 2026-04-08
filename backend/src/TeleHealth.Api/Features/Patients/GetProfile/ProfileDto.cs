using Facet;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Patients.GetProfile;

public partial record PatientProfileDto(
    Guid UserPublicId,
    Guid PatientPublicId,
    string FirstName,
    string LastName,
    string Role,
    string Email,
    string? BloodGroup,
    EmergencyContact? EmergencyContact,
    List<Allergy>? Allergies
) { }
