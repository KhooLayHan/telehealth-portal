using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Admins.GetAllDepartments;

// Queries departments with active doctor counts for the admin department table.
public sealed class AdminGetAllDepartmentsHandler(ApplicationDbContext db)
{
    public async Task<IReadOnlyList<AdminDepartmentDto>> HandleAsync(CancellationToken ct)
    {
        return await db
            .Departments.AsNoTracking()
            .OrderBy(d => d.Name)
            .Select(d => new AdminDepartmentDto
            {
                Slug = d.Slug,
                Name = d.Name,
                Description = d.Description,
                StaffMembers = d.Doctors.Count,
            })
            .ToListAsync(ct);
    }
}
