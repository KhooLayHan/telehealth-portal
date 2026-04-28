namespace TeleHealth.Api.Features.Admins.UpdateSettings;

// Represents the clinic-wide settings values admins can update.
public sealed record AdminUpdateSettingsCommand(
    string ClinicName,
    string SupportEmail,
    short DefaultAppointmentDurationMinutes,
    List<AdminUpdateOperatingHourCommand> OperatingHours
);
