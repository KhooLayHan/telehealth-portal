using FluentValidation;
using NodaTime;

namespace TeleHealth.Api.Features.Schedules.CreateSchedule;

// Validates that a doctor schedule slot has a valid doctor, date, time range, and status.
public sealed class CreateScheduleValidator : AbstractValidator<CreateScheduleCommand>
{
    private static readonly HashSet<string> s_allowedStatuses = ["available", "blocked"];

    public CreateScheduleValidator()
    {
        RuleFor(x => x.DoctorPublicId).NotEmpty();
        RuleFor(x => x.Date)
            .GreaterThanOrEqualTo(SystemClock.Instance.GetCurrentInstant().InUtc().Date)
            .WithMessage("Cannot create schedules for past dates.");
        RuleFor(x => x.EndTime).GreaterThan(x => x.StartTime);
        RuleFor(x => x.ScheduleStatus)
            .NotEmpty()
            .Must(status => s_allowedStatuses.Contains(status.Trim().ToLowerInvariant()))
            .WithMessage("Schedule status must be Available or Blocked.");
    }
}
