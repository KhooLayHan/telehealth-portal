using FluentValidation;

namespace TeleHealth.Api.Features.Patients.UpdatePatientRecord;

public class UpdatePatientRecordValidator : AbstractValidator<UpdatePatientRecordCommand>
{
    private static readonly char[] ValidGenders = ['M', 'F', 'O', 'N'];

    public UpdatePatientRecordValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Username).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.IcNumber)
            .NotEmpty()
            .Matches(@"^\d{12}$")
            .WithMessage("IC number must be exactly 12 digits.");
        RuleFor(x => x.DateOfBirth).NotEmpty();
        RuleFor(x => x.PhoneNumber).MaximumLength(16).When(x => x.PhoneNumber != null);
        RuleFor(x => x.Gender)
            .Must(g => Array.IndexOf(ValidGenders, g) >= 0)
            .WithMessage("Gender must be M, F, O, or N.");

        When(
            x => x.BloodGroup != null,
            () =>
            {
                RuleFor(x => x.BloodGroup)
                    .Matches("^(A|B|AB|O)[+-]$")
                    .WithMessage("Invalid blood group format. Use format like A+ or O-");
            }
        );

        When(
            x => x.EmergencyContact != null,
            () =>
            {
                RuleFor(x => x.EmergencyContact!.Name).NotEmpty().MaximumLength(100);
                RuleFor(x => x.EmergencyContact!.Relationship).NotEmpty().MaximumLength(50);
                RuleFor(x => x.EmergencyContact!.Phone).NotEmpty().MaximumLength(16);
            }
        );

        RuleForEach(x => x.Allergies)
            .ChildRules(allergy =>
            {
                allergy.RuleFor(a => a.Allergen).NotEmpty().MaximumLength(100);

                allergy
                    .RuleFor(a => a.Severity)
                    .Must(s => new[] { "Mild", "Moderate", "Severe" }.Contains(s))
                    .WithMessage("Severity must be 'Mild', 'Moderate', or 'Severe'.");

                allergy.RuleFor(a => a.Reaction).NotEmpty().MaximumLength(255);
            });
    }
}
