namespace TeleHealth.Api.Features.SystemSettings.GetPublic;

// Represents public-facing system settings safe for unauthenticated screens.
public sealed record GetPublicSystemSettingsDto(string SystemName);
