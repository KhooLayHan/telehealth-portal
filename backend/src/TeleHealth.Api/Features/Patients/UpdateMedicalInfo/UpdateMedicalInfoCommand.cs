using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Patients.UpdateMedicalInfo;

public sealed record UpdateMedicalInfoCommand(
    string BloodGroup,
    EmergencyContact? EmergencyContact,
    List<Allergy> Allergies)
{
}