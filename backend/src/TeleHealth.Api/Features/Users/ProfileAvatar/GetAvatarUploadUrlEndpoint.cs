using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using TeleHealth.Api.Common;
using TeleHealth.Api.Infrastructure.Aws;

namespace TeleHealth.Api.Features.Users.ProfileAvatar;

public static class GetAvatarUploadUrlEndpoint
{
    public static void MapGetAvatarUploadUrlEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Users.GetAvatarUploadUrl,
                (ClaimsPrincipal user, [FromQuery] string contentType, IS3Service s3Service) =>
                {
                    var publicIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(publicIdString, out var publicId))
                        return Results.Unauthorized();

                    var extension = contentType switch
                    {
                        "image/png" => ".png",
                        "image/webp" => ".webp",
                        _ => ".jpg",
                    };

                    var objectKey = $"avatars/{publicId}{extension}";
                    var uploadUrl = s3Service.GenerateProfileImageUploadUrl(objectKey, contentType);
                    var publicUrl = s3Service.GetProfileImagePublicUrl(objectKey);

                    return Results.Ok(new { uploadUrl, publicUrl });
                }
            )
            .WithName("GetAvatarUploadUrl")
            .WithTags("Users")
            .RequireAuthorization();
    }
}
