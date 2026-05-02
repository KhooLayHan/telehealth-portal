using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Common.Exceptions.Users;
using TeleHealth.Api.Features.Admins.GetAllLabTechs;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Admins.GetLabTech;

// Fetches one active lab technician profile by public ID for admin detail views.
public sealed class AdminGetLabTechHandler(ApplicationDbContext db)
{
    private const string LabTechSlug = "lab-tech";

    public async Task<AdminLabTechDto> HandleAsync(Guid labTechPublicId, CancellationToken ct)
    {
        var labTech =
            await db
                .Users.AsNoTracking()
                .Where(u =>
                    u.PublicId == labTechPublicId && u.Roles.Any(r => r.Slug == LabTechSlug)
                )
                .Select(u => new AdminLabTechDto
                {
                    PublicId = u.PublicId,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Username = u.Username,
                    Email = u.Email,
                    PhoneNumber = u.Phone,
                    Slug = u.Slug,
                    IcNumber = u.IcNumber,
                    Gender = u.Gender,
                    DateOfBirth = u.DateOfBirth,
                    AvatarUrl = u.AvatarUrl,
                    Address = u.Address,
                    CreatedAt = u.CreatedAt,
                    DeletedAt = u.DeletedAt,
                })
                .FirstOrDefaultAsync(ct)
            ?? throw new UserNotFoundException(labTechPublicId);

        return labTech;
    }
}
