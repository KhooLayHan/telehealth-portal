using FluentValidation;

namespace TeleHealth.Api.Features.Admins.UpdateSettings;

// Validates admin updates to clinic-wide settings and weekly operating hours.
public sealed class AdminUpdateSettingsValidator : AbstractValidator<AdminUpdateSettingsCommand>
{
    private static readonly HashSet<short> s_allowedDurations = [15, 30, 45, 60];

    public AdminUpdateSettingsValidator()
    {
        RuleFor(x => x.ClinicName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.SupportEmail).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.DefaultAppointmentDurationMinutes)
            .Must(duration => s_allowedDurations.Contains(duration))
            .WithMessage("Default appointment duration must be 15, 30, 45, or 60 minutes.");

        RuleFor(x => x.OperatingHours)
            .NotNull()
            .Must(hours => hours is not null && hours.Count == 7)
            .WithMessage("Operating hours must include all seven days.")
            .Must(hours =>
                hours is not null && hours.Select(h => h.DayOfWeek).Distinct().Count() == 7
            )
            .WithMessage("Operating hours must include each day only once.");

        RuleForEach(x => x.OperatingHours)
            .ChildRules(hour =>
            {
                hour.RuleFor(x => x.DayOfWeek).InclusiveBetween((short)1, (short)7);
                hour.RuleFor(x => x.OpenTime).NotNull().When(x => x.IsOpen);
                hour.RuleFor(x => x.CloseTime).NotNull().When(x => x.IsOpen);
                hour.RuleFor(x => x)
                    .Must(x => !x.IsOpen || x.CloseTime > x.OpenTime)
                    .WithMessage("Close time must be after open time.");
            });
    }
}
