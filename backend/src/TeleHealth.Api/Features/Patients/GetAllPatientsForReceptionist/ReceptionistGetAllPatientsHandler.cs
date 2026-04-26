using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Patients.GetAllPatientsForReceptionist;

public sealed class ReceptionistGetAllPatientsHandler(ApplicationDbContext db)
{
    private const int MaxPageSize = 50;

    public async Task<PagedResult<ReceptionistPatientsDto>> HandleAsync(
        ReceptionistGetAllPatientsQuery query,
        CancellationToken ct
    )
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);

        IQueryable<Patient> q = db.Patients.AsNoTracking().Include(p => p.User);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search}%";
            q = q.Where(p =>
                EF.Functions.ILike(p.User.FirstName + " " + p.User.LastName, pattern)
                || EF.Functions.ILike(p.User.Email, pattern)
                || EF.Functions.ILike(p.User.IcNumber, pattern)
            );
        }

        q =
            query.SortOrder?.ToLowerInvariant() == "desc"
                ? q.OrderByDescending(p => p.User.LastName)
                : q.OrderBy(p => p.User.LastName);

        var totalCount = await q.CountAsync(ct);

        // Fetch the page of Patient entities first, then map in memory
        // (EmergencyContacts wrapping can't be done inside an EF expression tree)
        var rawItems = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        var items = rawItems
            .Select(p => new ReceptionistPatientsDto
            {
                UserPublicId = p.User.PublicId,
                PatientPublicId = p.PublicId,
                Slug = p.Slug,
                FirstName = p.User.FirstName,
                LastName = p.User.LastName,
                AvatarUrl = p.User.AvatarUrl,
                PatientEmail = p.User.Email,
                DateOfBirth = p.User.DateOfBirth,
                PhoneNumber = p.User.Phone ?? string.Empty,
                IcNumber = p.User.IcNumber,
                BloodGroup = p.BloodGroup ?? string.Empty,
                Allergies = p.Allergies,
                EmergencyContacts = p.EmergencyContact != null ? [p.EmergencyContact] : null,
            })
            .ToList();

        return new PagedResult<ReceptionistPatientsDto>(items, totalCount, page, pageSize);
    }
}
