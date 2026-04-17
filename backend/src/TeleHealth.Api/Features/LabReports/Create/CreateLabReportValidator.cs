using FluentValidation;

namespace TeleHealth.Api.Features.LabReports.Create;

public class CreateLabReportValidator : AbstractValidator<CreateLabReportCommand>
{
    public CreateLabReportValidator()
    {
        RuleFor(x => x.PatientId).GreaterThan(0);
        RuleFor(x => x.ReportType).NotEmpty().MaximumLength(100);
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(255);
        RuleFor(x => x.ContentType)
            .NotEmpty()
            .Must(c => c == "application/pdf" || c.StartsWith("image/", StringComparison.Ordinal))
            .WithMessage("Only PDFs and Images are allowed.");
    }
}
