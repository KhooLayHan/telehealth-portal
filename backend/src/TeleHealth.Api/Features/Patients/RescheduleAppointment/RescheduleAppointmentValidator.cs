using FluentValidation;

namespace TeleHealth.Api.Features.Patients.RescheduleAppointment;

public sealed class RescheduleAppointmentValidator : AbstractValidator<RescheduleAppointmentCommand>
{
    public RescheduleAppointmentValidator()
    {
        RuleFor(x => x.NewSchedulePublicId)
            .NotEmpty()
            .WithMessage("A new schedule time slot must be selected.")
            .Must(id => id != Guid.Empty)
            .WithMessage("The provided schedule ID is not valid.");
    }
}