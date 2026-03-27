using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Users.Login;

public sealed class LoginHandler(
    ApplicationDbContext db,
    IPasswordHasher<User> passwordHasher,
    IConfiguration config,
    IHttpContextAccessor httpContextAccessor
)
{
    public async Task<bool> HandleAsync(LoginCommand command, CancellationToken ct)
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

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.PublicId.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("FirstName", user.FirstName),
        };

        // Add Role Claims for [Authorize(Roles = "Admin")]
        foreach (var role in user.Roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role.Slug));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: "TeleHealthApi",
            audience: "TeleHealthFrontend",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        // Set the HttpOnly Cookie (XSS Protection)
        httpContextAccessor.HttpContext?.Response.Cookies.Append(
            "X-Access-Token",
            tokenString,
            new CookieOptions
            {
                HttpOnly = true, // JavaScript cannot read this cookie!
                Secure = true, // Only sent over HTTPS
                SameSite = SameSiteMode.Strict, // Prevents CSRF attacks
                Expires = DateTimeOffset.UtcNow.AddHours(8),
            }
        );

        return true;
    }
}
