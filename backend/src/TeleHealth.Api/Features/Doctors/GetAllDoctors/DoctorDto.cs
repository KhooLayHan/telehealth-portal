using System.Linq.Expressions;

using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Doctors.GetAllDoctors;

public sealed record DoctorListDto(
    string FirstName,
    string LastName,
    Guid DoctorPublicId,
    string Specialization
)
{
    public static Expression<Func<Doctor, DoctorListDto>> Projection =>
        d => new DoctorListDto(d.User.FirstName, d.User.LastName, d.PublicId, d.Specialization);
}