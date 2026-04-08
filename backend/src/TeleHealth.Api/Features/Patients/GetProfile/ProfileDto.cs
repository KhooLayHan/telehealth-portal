using Facet;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Patients.GetProfile;

[Facet(typeof(Patient), Include = ["PublicId", "BloodGroup", "EmergencyContact", "Allergies"])]
public partial record PatientProfileDto(
    string FirstName,
    string LastName,
    string Email,
    string Role
) { }
