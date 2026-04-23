using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.LabReports.GetAllPatients;

public sealed record LabTechPatientDto(
    Guid PatientPublicId,
    string Slug,
    string FirstName,
    string LastName,
    string FullName
)
{
    public static LabTechPatientDto FromEntity(Patient p) =>
        new(
            p.PublicId,
            p.User.Slug,
            p.User.FirstName,
            p.User.LastName,
            $"{p.User.FirstName} {p.User.LastName}"
        );
}
