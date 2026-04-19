using FluentValidation;

namespace TeleHealth.Api.Features.LabReports.Complete;

public sealed class CompleteLabReportValidator : AbstractValidator<CompleteLabReportCommand>
{
    public CompleteLabReportValidator()
    {
        RuleForEach(x => x.Biomarkers)
            .ChildRules(b =>
            {
                b.RuleFor(x => x.Name).NotEmpty().WithMessage("Biomarker name is required.");

                b.RuleFor(x => x.Value).NotEmpty().WithMessage("Biomarker value is required.");

                b.RuleFor(x => x.Unit).NotEmpty().WithMessage("Unit is required.");

                b.RuleFor(x => x.ReferenceRange)
                    .NotEmpty()
                    .WithMessage("Reference range is required.");

                b.RuleFor(x => x.Flag).NotEmpty().WithMessage("Flag is required.");
            });
    }
}