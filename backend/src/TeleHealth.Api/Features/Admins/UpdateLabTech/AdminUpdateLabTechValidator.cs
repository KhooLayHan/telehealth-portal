using FluentValidation;
using NodaTime;

namespace TeleHealth.Api.Features.Admins.UpdateLabTech;

// Validates the admin lab technician update command before it reaches the handler.
public sealed class AdminUpdateLabTechValidator : AbstractValidator<AdminUpdateLabTechCommand>
{
    private static readonly char[] ValidGenders = ['M', 'F', 'O', 'N'];

    public AdminUpdateLabTechValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Username).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(x => x.PhoneNumber).MaximumLength(20).When(x => x.PhoneNumber is not null);
        RuleFor(x => x.Gender)
            .Must(g => Array.IndexOf(ValidGenders, g) >= 0)
            .WithMessage("Gender must be M, F, O, or N.");
        RuleFor(x => x.DateOfBirth)
            .Must(dob => dob <= SystemClock.Instance.GetCurrentInstant().InUtc().Date)
            .WithMessage("Date of birth cannot be in the future.");

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
