using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Slugify;
using TeleHealth.Api.Common.Constants;
using TeleHealth.Api.Common.Exceptions.Patients;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Features.LabReports.InitializeUpload;
using TeleHealth.Api.Infrastructure.Aws;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.LabReports.Complete;

public sealed class CompleteLabReportValidator : AbstractValidator<CompleteLabReportCommand>
{
    // string Name,
    // string Value,
    // string Unit,
    // string ReferenceRange,
    // string Flag
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
