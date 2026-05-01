using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Doctors.GetAllDoctors;

public sealed class GetAllDoctorsHandler(ApplicationDbContext db)
{
    private const int MaxPageSize = 50;

    private static readonly Dictionary<char, string> s_genderMap = new()
    {
        { 'M', "Male" },
        { 'F', "Female" },
        { 'O', "Other" },
        { 'N', "Not specified" },
    };

    public async Task<PagedResult<DoctorListDto>> HandleAsync(
        GetAllDoctorsQuery query,
        CancellationToken ct
    )
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);

        var doctorsQuery = db
            .Doctors.AsNoTracking()
            .Include(d => d.User)
            .Include(d => d.Department)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search}%";
            doctorsQuery = doctorsQuery.Where(d =>
                EF.Functions.ILike(d.User.FirstName + " " + d.User.LastName, pattern)
                || EF.Functions.ILike(d.User.Email, pattern)
                || EF.Functions.ILike(d.User.Username, pattern)
                || EF.Functions.ILike(d.Specialization, pattern)
                || EF.Functions.ILike(d.Department.Name, pattern)
                || EF.Functions.ILike(d.LicenseNumber, pattern)
            );
        }

        if (!string.IsNullOrWhiteSpace(query.Department))
        {
            doctorsQuery = doctorsQuery.Where(d => d.Department.Name == query.Department);
        }

        if (!string.IsNullOrWhiteSpace(query.Specialization))
        {
            doctorsQuery = doctorsQuery.Where(d => d.Specialization == query.Specialization);
        }

        var totalCount = await doctorsQuery.CountAsync(ct);

        var doctors = await doctorsQuery
            .OrderBy(d => d.User.LastName)
            .ThenBy(d => d.User.FirstName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = doctors
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

        return new PagedResult<DoctorListDto>(items, totalCount, page, pageSize);
    }
}
