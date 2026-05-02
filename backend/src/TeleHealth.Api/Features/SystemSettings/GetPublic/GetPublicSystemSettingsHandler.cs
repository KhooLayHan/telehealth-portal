using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Features.Admins.GetSettings;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.SystemSettings.GetPublic;

// Reads public-facing system settings from the singleton settings record.
public sealed class GetPublicSystemSettingsHandler(ApplicationDbContext db)
{
    private const string DefaultSystemName = "TeleHealth Medical Centre";
    private const string DefaultSupportEmail = "support@telehealth.com";

    public async Task<GetPublicSystemSettingsDto> HandleAsync(CancellationToken ct)
    {
        var settings = await db
            .SystemSettings.AsNoTracking()
            .Where(s => s.Slug == AdminGetSettingsHandler.SettingsSlug)
            .Select(s => new { s.ClinicName, s.SupportEmail })
            .FirstOrDefaultAsync(ct);

        return new GetPublicSystemSettingsDto(
            settings?.ClinicName ?? DefaultSystemName,
            settings?.SupportEmail ?? DefaultSupportEmail
        );
    }
}
