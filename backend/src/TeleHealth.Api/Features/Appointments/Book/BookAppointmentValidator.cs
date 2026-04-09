using FluentValidation;

namespace TeleHealth.Api.Features.Appointments.Book;

public class BookAppointmentValidator : AbstractValidator<BookAppointmentCommand>
{
    public BookAppointmentValidator()
    {
        RuleFor(x => x.SchedulePublicId)
            .NotEmpty()
            .WithMessage("A schedule slot must be selected.");

        RuleFor(x => x.VisitReason)
            .NotEmpty()
            .WithMessage("Please describe your reason for visiting.")
            .MaximumLength(500)
            .WithMessage("Visit reason cannot exceed 500 characters.");

        RuleForEach(x => x.Symptoms)
            .ChildRules(symptom =>
            {
                symptom
                    .RuleFor(s => s.Name)
                    .NotEmpty()
                    .MaximumLength(100)
                    .WithMessage("Each symptom must have a name.");

                symptom
                    .RuleFor(s => s.Severity)
                    .Must(s => new[] { "Mild", "Moderate", "Severe" }.Contains(s))
                    .WithMessage("Severity must be 'Mild', 'Moderate', or 'Severe'.");

                symptom
                    .RuleFor(s => s.Duration)
                    .NotEmpty()
                    .MaximumLength(100)
                    .WithMessage("Symptom duration cannot exceed 100 characters.");
            });
    }
}
