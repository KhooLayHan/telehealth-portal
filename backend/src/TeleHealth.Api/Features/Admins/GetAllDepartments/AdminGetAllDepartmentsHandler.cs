using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Admins.GetAllDepartments;

// Queries departments with active doctor counts for the admin department table.
public sealed class AdminGetAllDepartmentsHandler(ApplicationDbContext db)
{
    private const int MaxPageSize = 50;

    public async Task<PagedResult<AdminDepartmentDto>> HandleAsync(
        AdminGetAllDepartmentsQuery query,
        CancellationToken ct
    )
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);
        var departmentsQuery = db.Departments.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search}%";
            departmentsQuery = departmentsQuery.Where(d =>
                EF.Functions.ILike(d.Name, pattern)
                || (d.Description != null && EF.Functions.ILike(d.Description, pattern))
            );
        }

        departmentsQuery = departmentsQuery.OrderBy(d => d.Name);

        var totalCount = await departmentsQuery.CountAsync(ct);

        var items = await departmentsQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new AdminDepartmentDto
            {
                Slug = d.Slug,
                Name = d.Name,
                Description = d.Description,
                StaffMembers = d.Doctors.Count,
                CreatedAt = d.CreatedAt,
            })
            .ToListAsync(ct);

        return new PagedResult<AdminDepartmentDto>(items, totalCount, page, pageSize);
    }
}
