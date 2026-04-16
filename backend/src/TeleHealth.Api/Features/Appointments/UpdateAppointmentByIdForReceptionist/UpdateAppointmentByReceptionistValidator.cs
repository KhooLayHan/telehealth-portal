using FluentValidation;

namespace TeleHealth.Api.Features.Appointments.UpdateAppointmentByIdForReceptionist;

public sealed class UpdateAppointmentByReceptionistValidator
    : AbstractValidator<UpdateAppointmentByReceptionistCommand>
{
    public UpdateAppointmentByReceptionistValidator()
    {
        RuleFor(x => x.StatusSlug).NotEmpty();

        RuleFor(x => x.SchedulePublicId).NotEqual(Guid.Empty);

        When(
            x => x.StatusSlug == "cancelled",
            () =>
            {
                RuleFor(x => x.CancellationReason)
                    .NotEmpty()
                    .WithMessage("Cancellation reason is required when cancelling an appointment.")
                    .MaximumLength(500);
            }
        );
    }
}
