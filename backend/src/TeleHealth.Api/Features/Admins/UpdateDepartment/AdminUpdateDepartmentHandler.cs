using Microsoft.EntityFrameworkCore;
using Npgsql;
using Serilog;
using Slugify;
using TeleHealth.Api.Common.Exceptions.Departments;
using TeleHealth.Api.Features.Admins.GetAllDepartments;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Admins.UpdateDepartment;

// Finds the department by slug, applies editable changes, and persists them.
public sealed class AdminUpdateDepartmentHandler(ApplicationDbContext db)
{
    public async Task<AdminDepartmentDto> HandleAsync(
        string slug,
        AdminUpdateDepartmentCommand cmd,
        CancellationToken ct
    )
    {
        Log.Information("Attempting to update department. DepartmentSlug: {DepartmentSlug}", slug);

        var department =
            await db.Departments.FirstOrDefaultAsync(d => d.Slug == slug, ct)
            ?? throw new DepartmentNotFoundException();

        SlugHelper slugHelper = new();
        var name = cmd.Name.Trim();
        var description = string.IsNullOrWhiteSpace(cmd.Description)
            ? null
            : cmd.Description.Trim();
        var nextSlug = slugHelper.GenerateSlug(name);

        var departmentExists = await db.Departments.AnyAsync(
            d => d.Slug == nextSlug && d.Id != department.Id,
            ct
        );

        if (departmentExists)
        {
            Log.Warning(
                "Duplicate department update attempt. DepartmentSlug: {DepartmentSlug}",
                nextSlug
            );
            throw new DepartmentAlreadyExistsException();
        }

        department.Slug = nextSlug;
        department.Name = name;
        department.Description = description;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is PostgresException pg
                && pg.SqlState == PostgresErrorCodes.UniqueViolation
            )
        {
            Log.Warning(
                ex,
                "Duplicate department update attempt. DepartmentSlug: {DepartmentSlug}",
                nextSlug
            );
            throw new DepartmentAlreadyExistsException();
        }

        var staffMembers = await db.Doctors.CountAsync(d => d.DepartmentId == department.Id, ct);

        Log.Information(
            "Successfully updated department. DepartmentSlug: {DepartmentSlug}",
            department.Slug
        );

        return new AdminDepartmentDto
        {
            Slug = department.Slug,
            Name = department.Name,
            Description = department.Description,
            StaffMembers = staffMembers,
        };
    }
}
