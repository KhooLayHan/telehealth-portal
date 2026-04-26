using Microsoft.EntityFrameworkCore;
using NodaTime;
using Npgsql;
using Serilog;
using Slugify;
using TeleHealth.Api.Common.Exceptions.Departments;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Features.Admins.GetAllDepartments;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Admins.CreateDepartment;

// Handles creating a new department for admin management.
public sealed class AdminCreateDepartmentHandler(ApplicationDbContext db)
{
    public async Task<AdminDepartmentDto> HandleAsync(
        AdminCreateDepartmentCommand cmd,
        CancellationToken ct
    )
    {
        Log.Information("Attempting to create a new department.");

        SlugHelper slugHelper = new();
        var name = cmd.Name.Trim();
        var description = string.IsNullOrWhiteSpace(cmd.Description)
            ? null
            : cmd.Description.Trim();
        var slug = slugHelper.GenerateSlug(name);

        var departmentExists = await db.Departments.AnyAsync(d => d.Slug == slug, ct);

        if (departmentExists)
        {
            Log.Warning(
                "Duplicate department creation attempt. DepartmentSlug: {DepartmentSlug}",
                slug
            );
            throw new DepartmentAlreadyExistsException();
        }

        var department = new Department
        {
            Slug = slug,
            Name = name,
            Description = description,
            CreatedAt = SystemClock.Instance.GetCurrentInstant(),
        };

        db.Departments.Add(department);

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
                "Duplicate department creation attempt. DepartmentSlug: {DepartmentSlug}",
                slug
            );
            throw new DepartmentAlreadyExistsException();
        }

        Log.Information("Successfully created department. DepartmentSlug: {DepartmentSlug}", slug);

        return new AdminDepartmentDto
        {
            Slug = department.Slug,
            Name = department.Name,
            Description = department.Description,
            StaffMembers = 0,
            CreatedAt = department.CreatedAt,
        };
    }
}
