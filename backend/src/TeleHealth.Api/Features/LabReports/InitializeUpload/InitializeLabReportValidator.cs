using FluentValidation;

namespace TeleHealth.Api.Features.LabReports.InitializeUpload;

public class InitializeLabReportValidator : AbstractValidator<InitializeLabReportCommand>
{
    public InitializeLabReportValidator()
    {
        RuleFor(x => x.PatientPublicId).NotEmpty();
        RuleFor(x => x.ReportType).NotEmpty().MaximumLength(100);
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(255);
        RuleFor(x => x.ContentType)
            .Must(c =>
                c == "application/pdf" || c.StartsWith("image/", StringComparison.InvariantCulture)
            )
            .WithMessage("Only PDFs and Images are allowed.");
    }
}
