using Facet;
using Facet.Mapping;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Doctors.GetAllDoctors;

[Facet(
    typeof(Doctor),
    Include = ["PublicId", "Specialization"],
    Configuration = typeof(DoctorMappingConfig)
)]
public partial record DoctorListDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
}

public class DoctorMappingConfig : IFacetMapConfiguration<Doctor, DoctorListDto>
{
    public static void Map(Doctor source, DoctorListDto target)
    {
        target.FirstName = $"{source.User.FirstName}";
        target.LastName = $"{source.User.LastName}";
    }
}
