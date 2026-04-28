using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Admins.GetAllLabTechs;

// Queries active lab technician users with pagination and optional search
public sealed class AdminGetAllLabTechsHandler(ApplicationDbContext db)
{
    private const int MaxPageSize = 50;
    private const string LabTechSlug = "lab-tech";

    public async Task<PagedResult<AdminLabTechDto>> HandleAsync(
        AdminGetAllLabTechsQuery query,
        CancellationToken ct
    )
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);

        var q = db.Users.AsNoTracking().Where(u => u.Roles.Any(r => r.Slug == LabTechSlug));

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search}%";
            q = q.Where(u =>
                EF.Functions.ILike(u.FirstName + " " + u.LastName, pattern)
                || EF.Functions.ILike(u.Email, pattern)
                || EF.Functions.ILike(u.Username, pattern)
                || (u.Phone != null && EF.Functions.ILike(u.Phone, pattern))
            );
        }

        q =
            query.SortOrder?.ToLowerInvariant() == "desc"
                ? q.OrderByDescending(u => u.LastName).ThenByDescending(u => u.FirstName)
                : q.OrderBy(u => u.LastName).ThenBy(u => u.FirstName);

        var totalCount = await q.CountAsync(ct);

        var items = await q.Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminLabTechDto
            {
                PublicId = u.PublicId,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Username = u.Username,
                Email = u.Email,
                PhoneNumber = u.Phone,
                Slug = u.Slug,
                Gender = u.Gender,
                DateOfBirth = u.DateOfBirth,
                AvatarUrl = u.AvatarUrl,
                Address = u.Address,
                CreatedAt = u.CreatedAt,
                DeletedAt = u.DeletedAt,
            })
            .ToListAsync(ct);

        return new PagedResult<AdminLabTechDto>(items, totalCount, page, pageSize);
    }
}
