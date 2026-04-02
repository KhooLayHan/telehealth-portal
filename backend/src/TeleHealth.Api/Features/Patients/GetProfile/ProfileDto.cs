using Facet;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Patients.GetProfile;

[Facet(typeof(Patient), Include = ["PublicId", "BloodGroup", "EmergencyContact", "Allergies"])]
public partial record ProfileDto
{
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
}