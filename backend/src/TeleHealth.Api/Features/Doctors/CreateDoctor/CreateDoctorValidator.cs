using FluentValidation;

namespace TeleHealth.Api.Features.Doctors.CreateDoctor;

public sealed class CreateDoctorValidator : AbstractValidator<CreateDoctorCommand>
{
    public CreateDoctorValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Username).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Z]")
            .WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[0-9]")
            .WithMessage("Password must contain at least one number.");
        RuleFor(x => x.PhoneNumber).MaximumLength(20).When(x => x.PhoneNumber is not null);
        RuleFor(x => x.Gender).Must(g => g is "M" or "F" or "O" or "N");
        RuleFor(x => x.IcNumber).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Specialization).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LicenseNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.ConsultationFee)
            .GreaterThanOrEqualTo(0)
            .When(x => x.ConsultationFee.HasValue);
        RuleFor(x => x.DepartmentName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Bio).MaximumLength(2000).When(x => x.Bio is not null);

        RuleForEach(x => x.Qualifications)
            .ChildRules(q =>
            {
                q.RuleFor(x => x.Degree).NotEmpty().MaximumLength(100);
                q.RuleFor(x => x.Institution).NotEmpty().MaximumLength(200);
                q.RuleFor(x => x.Year).InclusiveBetween(1900, 2100);
            });

        RuleFor(x => x.Address!.Street)
            .NotEmpty()
            .MaximumLength(200)
            .When(x => x.Address is not null);
        RuleFor(x => x.Address!.City)
            .NotEmpty()
            .MaximumLength(100)
            .When(x => x.Address is not null);
        RuleFor(x => x.Address!.State)
            .NotEmpty()
            .MaximumLength(100)
            .When(x => x.Address is not null);
        RuleFor(x => x.Address!.PostalCode)
            .NotEmpty()
            .MaximumLength(20)
            .When(x => x.Address is not null);
        RuleFor(x => x.Address!.Country)
            .NotEmpty()
            .MaximumLength(100)
            .When(x => x.Address is not null);
    }
}
