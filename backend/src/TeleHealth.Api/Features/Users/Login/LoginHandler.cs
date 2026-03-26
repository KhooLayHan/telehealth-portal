using System.Security.Claims;

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Users.Login;

public sealed class LoginHandler(
    ApplicationDbContext db,
    IPasswordHasher<User> passwordHasher,
    IConfiguration config,
    IHttpContextAccessor httpContextAccessor)
{
    public async Task<bool> HandleAsync(LoginCommand command, CancellationToken token)
    {
        var user = await db.Users.Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == command.Email, token);

        if (user is null)
        {
            return false;
        }
        
        var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, command.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            return false;
        }
        
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
        };
    }
}