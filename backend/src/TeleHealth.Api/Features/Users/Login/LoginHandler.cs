using MassTransit;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Users.Login;

public sealed class LoginHandler(
    ApplicationDbContext db,
    IPasswordHasher<User> passwordHasher,
    ITokenService tokenService
)
{
    public async Task<bool> HandleAsync(
        LoginCommand command,
        HttpContext httpContext,
        CancellationToken ct
    )
    {
        var user = await db
            .Users.Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == command.Email, ct);

        if (user is null)
        {
            return false;
        }

        var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, command.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            return false;
        }

        await tokenService.GenerateTokenAsync(user, httpContext, ct);

        return true;
    }
}
