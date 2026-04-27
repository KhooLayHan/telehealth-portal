using FluentValidation;
using NodaTime;

namespace TeleHealth.Api.Features.Admins.CreateLabTech;

// Validates the admin request for creating a lab technician account.
public sealed class AdminCreateLabTechValidator : AbstractValidator<AdminCreateLabTechCommand>
{
    private static readonly char[] ValidGenders = ['M', 'F', 'O', 'N'];

    public AdminCreateLabTechValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Username).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Z]")
            .WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[a-z]")
            .WithMessage("Password must contain at least one lowercase letter.")
            .Matches("[0-9]")
            .WithMessage("Password must contain at least one digit.")
            .Matches("[^a-zA-Z0-9]")
            .WithMessage("Password must contain at least one special character.");
        RuleFor(x => x.PhoneNumber).MaximumLength(20).When(x => x.PhoneNumber is not null);
        RuleFor(x => x.Gender)
            .Must(g => Array.IndexOf(ValidGenders, g) >= 0)
            .WithMessage("Gender must be M, F, O, or N.");
        RuleFor(x => x.DateOfBirth)
            .Must(dob => dob <= SystemClock.Instance.GetCurrentInstant().InUtc().Date)
            .WithMessage("Date of birth cannot be in the future.");
        RuleFor(x => x.IcNumber)
            .NotEmpty()
            .Matches(@"^\d{12}$")
            .WithMessage("Malaysian IC Number must be exactly 12 digits without dashes.");
        When(
            x => x.Address is not null,
            () =>
            {
                RuleFor(x => x.Address!.Street).NotEmpty().MaximumLength(200);
                RuleFor(x => x.Address!.City).NotEmpty().MaximumLength(100);
                RuleFor(x => x.Address!.State).NotEmpty().MaximumLength(100);
                RuleFor(x => x.Address!.PostalCode).NotEmpty().MaximumLength(20);
                RuleFor(x => x.Address!.Country).NotEmpty().MaximumLength(100);
            }
        );
    }
}
