using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Features.Admins.GetSettings;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.SystemSettings.GetPublic;

// Reads public-facing system settings from the singleton settings record.
public sealed class GetPublicSystemSettingsHandler(ApplicationDbContext db)
{
    private const string DefaultSystemName = "TeleHealth Medical Centre";

    public async Task<GetPublicSystemSettingsDto> HandleAsync(CancellationToken ct)
    {
        var systemName = await db
            .SystemSettings.Where(s => s.Slug == AdminGetSettingsHandler.SettingsSlug)
            .Select(s => s.ClinicName)
            .FirstOrDefaultAsync(ct);

        return new GetPublicSystemSettingsDto(systemName ?? DefaultSystemName);
    }
}
