using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Common.Security;

public sealed class TokenService(IConfiguration configuration) : ITokenService
{
    public Task GenerateTokenAsync(User user, HttpContext httpContext, CancellationToken ct)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.PublicId.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("FirstName", user.FirstName),
        };

        foreach (var role in user.Roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role.Slug));
        }

        var secretKey =
            configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret configuration is required.");
        var issuer = configuration["Jwt:Issuer"] ?? "TeleHealthApi";
        var audience = configuration["Jwt:Audience"] ?? "TeleHealthFrontend";
        var expiryMinutes =
            int.TryParse(configuration["Jwt:ExpiryMinutes"], out var minutes) && minutes > 0
                ? minutes
                : 60;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        var isDevelopment = configuration["Environment"] == "Development";

        httpContext.Response.Cookies.Append(
            "X-Access-Token",
            tokenString,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = !isDevelopment,
                SameSite = isDevelopment ? SameSiteMode.Lax : SameSiteMode.None,
                Expires = DateTimeOffset.UtcNow.AddMinutes(expiryMinutes),
            }
        );

        return Task.CompletedTask;
    }
}
