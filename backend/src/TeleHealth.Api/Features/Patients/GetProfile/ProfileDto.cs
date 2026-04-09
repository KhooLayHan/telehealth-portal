using System.Linq.Expressions;
using Facet;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Patients.GetProfile;

public sealed record PatientProfileDto(
    Guid UserPublicId,
    Guid PatientPublicId,
    string FirstName,
    string LastName,
    string Email,
    string Role,
    string? BloodGroup,
    EmergencyContact? EmergencyContact,
    List<Allergy>? Allergies
)
{
    public static Expression<Func<Patient, PatientProfileDto>> Projection =>
        p => new PatientProfileDto(
            p.User.PublicId,
            p.PublicId,
            p.User.FirstName,
            p.User.LastName,
            p.User.Email,
            p.User.Roles.Select(r => r.Slug).FirstOrDefault() ?? "patient",
            p.BloodGroup,
            p.EmergencyContact,
            p.Allergies
        );
}
