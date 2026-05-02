using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Auth;
using TeleHealth.Api.Common.Exceptions.Users;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Users.ChangePassword;

// Handles password changes for the signed-in user after verifying the current password.
public sealed class ChangePasswordHandler(
    ApplicationDbContext db,
    IPasswordHasher<User> passwordHasher
)
{
    public async Task HandleAsync(
        Guid publicId,
        ChangePasswordCommand command,
        CancellationToken ct
    )
    {
        Log.Information("Changing password. UserId: {UserId}", publicId);

        var user = await db.Users.FirstOrDefaultAsync(u => u.PublicId == publicId, ct);
        if (user is null)
        {
            throw new UserNotFoundException(publicId);
        }

        var verificationResult = passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            command.CurrentPassword
        );

        if (verificationResult == PasswordVerificationResult.Failed)
        {
            Log.Warning("Password change failed.");
            throw new InvalidCredentialsException();
        }

        user.PasswordHash = passwordHasher.HashPassword(user, command.NewPassword);
        user.UpdatedAt = SystemClock.Instance.GetCurrentInstant();

        await db.SaveChangesAsync(ct);

        Log.Information("Password changed successfully. UserId: {UserId}", publicId);
    }
}
