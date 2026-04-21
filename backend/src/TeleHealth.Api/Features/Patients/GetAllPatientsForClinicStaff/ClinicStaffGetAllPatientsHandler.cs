using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Patients.GetAllPatientsForClinicStaff;

public sealed class ClinicStaffGetAllPatientsHandler(ApplicationDbContext db)
{
    private const int MaxPageSize = 50;

    public async Task<PagedResult<ClinicStaffPatientDto>> HandleAsync(
        ClinicStaffGetAllPatientsQuery query,
        CancellationToken ct
    )
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);

        IQueryable<Patient> q = db.Patients.AsNoTracking().Include(p => p.User);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search}%";
            q = q.Where(p => EF.Functions.ILike(p.User.FirstName + " " + p.User.LastName, pattern));
        }

        q = string.Equals(query.SortOrder, "desc", StringComparison.OrdinalIgnoreCase)
            ? q.OrderByDescending(p => p.User.LastName)
                .ThenByDescending(p => p.User.FirstName)
                .ThenByDescending(p => p.PublicId)
            : q.OrderBy(p => p.User.LastName).ThenBy(p => p.User.FirstName).ThenBy(p => p.PublicId);

        var totalCount = await q.CountAsync(ct);

        var skip = ((long)page - 1) * pageSize;
        if (skip >= totalCount)
        {
            return new PagedResult<ClinicStaffPatientDto>([], totalCount, page, pageSize);
        }

        var entities = await q.Skip((int)skip).Take(pageSize).ToListAsync(ct);

        var items = entities.Select(ClinicStaffPatientDto.FromEntity).ToList();

        return new PagedResult<ClinicStaffPatientDto>(items, totalCount, page, pageSize);
    }
}
