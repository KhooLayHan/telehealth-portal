using FluentValidation;

using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Patients.UpdateMedicalInfo;

public class UpdateMedicalInfoValidator : AbstractValidator<UpdateMedicalInfoCommand>
{
    public UpdateMedicalInfoValidator()
    {
        RuleFor(x => x.BloodGroup)
            .MaximumLength(3)
            .Matches("^(A|B|AB|O)[+-]$").When(x => !string.IsNullOrEmpty(x.BloodGroup))
            .WithMessage("Invalid blood group format. Use format like A+ or O-");

        // Validate the JSONB Emergency Contact
        When(x => x.EmergencyContact != null, () =>
        {
            RuleFor(x => x.EmergencyContact!.Name).NotEmpty().MaximumLength(100);
            RuleFor(x => x.EmergencyContact!.Relationship).NotEmpty().MaximumLength(50);
            RuleFor(x => x.EmergencyContact!.Phone).NotEmpty().MaximumLength(20);
        });

        // Validate the JSONB Allergies Array
        RuleForEach(x => x.Allergies).ChildRules(allergy =>
        {
            allergy.RuleFor(a => a.Allergen).NotEmpty().MaximumLength(100);
            
            allergy.RuleFor(a => a.Severity)
                .Must(s => new[] { "Mild", "Moderate", "Severe" }.Contains(s))
                .WithMessage("Severity must be 'Mild', 'Moderate', or 'Severe'.");
                
            allergy.RuleFor(a => a.Reaction).NotEmpty().MaximumLength(255);
        });
    } 
}