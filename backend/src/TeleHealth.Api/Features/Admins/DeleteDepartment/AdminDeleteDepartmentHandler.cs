using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Departments;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Admins.DeleteDepartment;

// Soft-deletes an admin department after confirming no active doctors are assigned.
public sealed class AdminDeleteDepartmentHandler(ApplicationDbContext db)
{
    public async Task HandleAsync(string slug, CancellationToken ct)
    {
        Log.Information("Attempting to delete department. DepartmentSlug: {DepartmentSlug}", slug);

        var department =
            await db.Departments.FirstOrDefaultAsync(d => d.Slug == slug, ct)
            ?? throw new DepartmentNotFoundException();

        var hasAssignedStaff = await db.Doctors.AnyAsync(d => d.DepartmentId == department.Id, ct);

        if (hasAssignedStaff)
        {
            Log.Warning(
                "Department delete blocked because staff are assigned. DepartmentSlug: {DepartmentSlug}",
                slug
            );
            throw new DepartmentHasAssignedStaffException();
        }

        department.DeletedAt = SystemClock.Instance.GetCurrentInstant();

        await db.SaveChangesAsync(ct);

        Log.Information("Successfully deleted department. DepartmentSlug: {DepartmentSlug}", slug);
    }
}
