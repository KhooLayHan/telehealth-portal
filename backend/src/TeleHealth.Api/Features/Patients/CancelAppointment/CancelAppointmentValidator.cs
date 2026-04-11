using FluentValidation;

namespace TeleHealth.Api.Features.Patients.CancelAppointment;

public sealed class CancelAppointmentValidator : AbstractValidator<CancelAppointmentCommand>
{
    public CancelAppointmentValidator()
    {
        RuleFor(x => x.CancellationReason)
            .NotEmpty()
            .WithMessage("A cancellation reason is required.")
            .MaximumLength(500)
            .WithMessage("A cancellation reason must be provided (maximum 500 characters).");
    }
}
