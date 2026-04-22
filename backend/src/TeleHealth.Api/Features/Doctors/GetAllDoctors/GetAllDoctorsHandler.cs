using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Doctors.GetAllDoctors;

public sealed class GetAllDoctorsHandler(ApplicationDbContext db)
{
    private static readonly Dictionary<char, string> s_genderMap = new()
    {
        { 'M', "Male" },
        { 'F', "Female" },
        { 'O', "Other" },
        { 'N', "Not specified" },
    };

    public async Task<List<DoctorListDto>> HandleAsync(CancellationToken ct)
    {
        var doctors = await db
            .Doctors.AsNoTracking()
            .Include(d => d.User)
            .Include(d => d.Department)
            .OrderBy(d => d.Id)
            .ToListAsync(ct);

        return doctors
            .Select(d => new DoctorListDto
            {
                DoctorPublicId = d.PublicId,
                Slug = d.Slug,
                FirstName = d.User.FirstName,
                LastName = d.User.LastName,
                Username = d.User.Username,
                Email = d.User.Email,
                Specialization = d.Specialization,
                DepartmentName = d.Department.Name,
                LicenseNumber = d.LicenseNumber,
                ConsultationFee = d.ConsultationFee,
                PhoneNumber = d.User.Phone,
                Gender = s_genderMap.GetValueOrDefault(d.User.Gender, "Not specified"),
                DateOfBirth = d.User.DateOfBirth,
                AvatarUrl = d.User.AvatarUrl,
                Address = d.User.Address is { } addr
                    ? new AddressDoctorDto(
                        addr.Street,
                        addr.City,
                        addr.State,
                        addr.PostalCode,
                        addr.Country
                    )
                    : null,
                Qualifications =
                    d.Qualifications?.Select(q => new QualificationDoctorDto(
                            q.Degree,
                            q.Institution,
                            q.Year
                        ))
                        .ToList()
                    ?? [],
                Bio = d.Bio,
                CreatedAt = d.CreatedAt,
            })
            .ToList();
    }
}
