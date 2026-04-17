using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Common.Security;

public interface ITokenService
{
    Task GenerateTokenAsync(User user, HttpContext httpContext, CancellationToken ct);
}
