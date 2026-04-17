using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Patients.GetAllPatientsForReceptionist;

public sealed record ReceptionistPatientsDto
{
    public Guid UserPublicId { get; init; }
    public Guid PatientPublicId { get; init; }
    public string Slug { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string PatientEmail { get; init; } = string.Empty;
    public LocalDate DateOfBirth { get; init; }
    public string PhoneNumber { get; init; } = string.Empty;
    public string IcNumber { get; init; } = string.Empty;
    public string BloodGroup { get; init; } = string.Empty;
    public List<Allergy>? Allergies { get; init; }
    public List<EmergencyContact>? EmergencyContacts { get; init; }
}
