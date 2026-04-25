using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.LabReports.GetAllLabReports;

public sealed class GetAllLabReportsHandler(ApplicationDbContext db)
{
    private const int MaxPageSize = 50;

    public async Task<PagedResult<LabReportDto>> HandleAsync(
        GetAllLabReportsQuery query,
        CancellationToken ct
    )
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);

        IQueryable<LabReport> q = db
            .LabReports.AsNoTracking()
            .Include(r => r.Patient)
                .ThenInclude(p => p.User)
            .Include(r => r.Consultation)
            .Include(r => r.LabReportStatus);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search}%";
            q = q.Where(r =>
                EF.Functions.ILike(
                    r.Patient.User.FirstName + " " + r.Patient.User.LastName,
                    pattern
                ) || EF.Functions.ILike(r.ReportType, pattern)
            );
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            q = q.Where(r => r.LabReportStatus.Slug == query.Status);
        }

        if (query.PatientPublicId.HasValue)
        {
            q = q.Where(r => r.Patient.PublicId == query.PatientPublicId.Value);
        }

        q = string.Equals(query.SortOrder, "desc", StringComparison.OrdinalIgnoreCase)
            ? q.OrderByDescending(r => r.CreatedAt).ThenByDescending(r => r.PublicId)
            : q.OrderBy(r => r.CreatedAt).ThenBy(r => r.PublicId);

        var totalCount = await q.CountAsync(ct);

        var skip = ((long)page - 1) * pageSize;
        if (skip >= totalCount)
        {
            return new PagedResult<LabReportDto>([], totalCount, page, pageSize);
        }

        var entities = await q.Skip((int)skip).Take(pageSize).ToListAsync(ct);
        var items = entities.Select(LabReportDto.FromEntity).ToList();

        return new PagedResult<LabReportDto>(items, totalCount, page, pageSize);
    }
}
