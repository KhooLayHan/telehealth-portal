using FluentValidation;

namespace TeleHealth.Api.Features.Admins.UpdateReceptionist;

// Validates the admin receptionist update command before it reaches the handler
public sealed class AdminUpdateReceptionistValidator
    : AbstractValidator<AdminUpdateReceptionistCommand>
{
    private static readonly char[] ValidGenders = ['M', 'F', 'O', 'N'];

    public AdminUpdateReceptionistValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Username).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(x => x.PhoneNumber).MaximumLength(20).When(x => x.PhoneNumber is not null);
        RuleFor(x => x.Gender)
            .Must(g => Array.IndexOf(ValidGenders, g) >= 0)
            .WithMessage("Gender must be M, F, O, or N.");

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
