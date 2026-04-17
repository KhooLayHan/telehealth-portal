using Microsoft.EntityFrameworkCore;

using NodaTime;

using TeleHealth.Api.Common.Exceptions.Doctors;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Doctors.GetDoctorPatients;

public sealed class GetDoctorPatientsHandler(ApplicationDbContext db)
{
    private const int MaxPageSize = 50;

    private static readonly Dictionary<string, string> GenderMap = new()
    {
        { "M", "Male" },
        { "F", "Female" },
        { "O", "Other" },
        { "N", "Not specified" },
    };

    public async Task<GetDoctorPatientsResponse> HandleAsync(
        Guid userPublicId,
        GetDoctorPatientsQuery query,
        CancellationToken ct
    )
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);

        var doctor = await db
            .Doctors.AsNoTracking()
            .Where(d => d.User.PublicId == userPublicId)
            .Select(d => new { d.Id })
            .FirstOrDefaultAsync(ct);

        if (doctor is null)
            throw new DoctorNotFoundException(userPublicId.ToString());

        var doctorId = doctor.Id;

        var patientsQuery = db
            .Patients.AsNoTracking()
            .Where(p => p.Appointments.Any(a => a.DoctorId == doctorId));

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search}%";
            patientsQuery = patientsQuery.Where(p =>
                EF.Functions.ILike(p.User.FirstName + " " + p.User.LastName, pattern)
            );
        }

        var totalCount = await patientsQuery.CountAsync(ct);

        var today = LocalDate.FromDateOnly(DateOnly.FromDateTime(DateTime.UtcNow));

        var raw = await patientsQuery
            .OrderBy(p => p.User.FirstName)
            .ThenBy(p => p.User.LastName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                p.PublicId,
                p.User.FirstName,
                p.User.LastName,
                p.User.DateOfBirth,
                p.User.Gender,
                p.BloodGroup,
                p.User.Phone,
                p.Allergies,
                p.EmergencyContact,
                TotalAppointments = p.Appointments.Count(a => a.DoctorId == doctorId),
                LastVisitDate = p
                    .Appointments.Where(a => a.DoctorId == doctorId)
                    .Max(a => (LocalDate?)a.DoctorSchedule.Date),
            })
            .ToListAsync(ct);

        var items = raw.Select(p =>
            {
                var dob = p.DateOfBirth;
                var age = today.Year - dob.Year;
                if (today.Month < dob.Month || (today.Month == dob.Month && today.Day < dob.Day))
                    age--;

                var allergies =
                    p.Allergies?.Select(a => new AllergyDto(a.Allergen, a.Severity, a.Reaction))
                        .ToList()
                    ?? [];

                var emergency = p.EmergencyContact is { } ec
                    ? new EmergencyContactDto(ec.Name, ec.Relationship, ec.Phone)
                    : null;

                return new DoctorPatientDto
                {
                    PatientPublicId = p.PublicId,
                    FullName = $"{p.FirstName} {p.LastName}",
                    Age = age,
                    Gender = GenderMap.GetValueOrDefault(p.Gender.ToString(), "Not specified"),
                    BloodGroup = p.BloodGroup,
                    Phone = p.Phone,
                    Allergies = allergies,
                    EmergencyContact = emergency,
                    TotalAppointments = p.TotalAppointments,
                    LastVisitDate = p.LastVisitDate,
                };
            })
            .ToList();

        return new GetDoctorPatientsResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
        };
    }
}