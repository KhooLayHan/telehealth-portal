using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using TeleHealth.Api.Common;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Users.GetMe;

// Represents the authenticated user's base profile data.
public sealed record GetMeResponse(
    Guid PublicId,
    string Email,
    string FirstName,
    string LastName,
    string Username,
    string? AvatarUrl,
    string? Phone,
    string IcNumber,
    LocalDate DateOfBirth,
    string? Gender,
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? State,
    string? PostalCode,
    string? Country,
    List<string> Roles
);

// * NOTE: Just a temporary implementation; will remove soon once full MVP RBAC support is implemented!
public static class GetMeEndpoint
{
    public static void MapGetMeEndpoint(this RouteGroupBuilder group)
    {
        // Route: GET /api/v1/me
        group
            .MapGet(
                ApiEndpoints.Users.GetMe,
                async (ApplicationDbContext db, ClaimsPrincipal user, CancellationToken ct) =>
                {
                    var publicIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(publicIdString, out var publicId))
                        return Results.Unauthorized();

                    // Universal identity — used by all roles (app shell)
                    var currentUser = await db
                        .Users.AsNoTracking()
                        .Include(u => u.Roles)
                        .Where(u => u.PublicId == publicId)
                        .Select(u => new
                        {
                            u.PublicId,
                            u.Email,
                            u.FirstName,
                            u.LastName,
                            u.Username,
                            u.AvatarUrl,
                            u.Phone,
                            u.IcNumber,
                            u.DateOfBirth,
                            u.Gender,
                            AddressLine1 = u.Address != null ? u.Address.Street : null,
                            AddressLine2 = (string?)null,
                            City = u.Address != null ? u.Address.City : null,
                            State = u.Address != null ? u.Address.State : null,
                            PostalCode = u.Address != null ? u.Address.PostalCode : null,
                            Country = u.Address != null ? u.Address.Country : null,
                            Roles = u.Roles.Select(r => r.Slug).ToList(),
                        })
                        .FirstOrDefaultAsync(ct);

                    return currentUser is not null
                        ? Results.Ok(
                            new GetMeResponse(
                                currentUser.PublicId,
                                currentUser.Email,
                                currentUser.FirstName,
                                currentUser.LastName,
                                currentUser.Username,
                                currentUser.AvatarUrl,
                                currentUser.Phone,
                                currentUser.IcNumber,
                                currentUser.DateOfBirth,
                                currentUser.Gender switch
                                {
                                    'M' => "male",
                                    'F' => "female",
                                    _ => "other",
                                },
                                currentUser.AddressLine1,
                                currentUser.AddressLine2,
                                currentUser.City,
                                currentUser.State,
                                currentUser.PostalCode,
                                currentUser.Country,
                                currentUser.Roles
                            )
                        )
                        : Results.NotFound();
                }
            )
            .WithName("GetMe")
            .WithTags("Users")
            .Produces<GetMeResponse>()
            .RequireAuthorization(); // Notice: NO specific policy! ANY logged-in user can hit this.
    }
}
