using FluentValidation;

namespace TeleHealth.Api.Features.LabReports.InitializeUpload;

public sealed class InitializeLabReportValidator : AbstractValidator<InitializeLabReportCommand>
{
    public InitializeLabReportValidator()
    {
        RuleFor(x => x.PatientPublicId)
            .NotEmpty()
            .WithMessage("A patient public ID must be selected.");

        RuleFor(x => x.ReportType)
            .NotEmpty()
            .WithMessage("A report type must be selected.")
            .MaximumLength(100);

        RuleFor(x => x.FileName)
            .NotEmpty()
            .WithMessage("File must have a custom name.")
            .MaximumLength(255);

        RuleFor(x => x.ContentType)
            .Must(c =>
                c == "application/pdf" || c.StartsWith("image/", StringComparison.InvariantCulture)
            )
            .WithMessage("Only PDFs and Images are allowed.");
    }
}