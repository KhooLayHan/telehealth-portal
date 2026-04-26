using FluentValidation;

namespace TeleHealth.Api.Features.Users.UpdateProfile;

public sealed class UpdateProfileValidator : AbstractValidator<UpdateProfileCommand>
{
    private static readonly System.Text.RegularExpressions.Regex NameRegex = new(
        @"^[a-zA-Z ]+$",
        System.Text.RegularExpressions.RegexOptions.Compiled
    );

    private static readonly System.Text.RegularExpressions.Regex PhoneRegex = new(
        @"^\d{10}$",
        System.Text.RegularExpressions.RegexOptions.Compiled
    );

    private static readonly System.Text.RegularExpressions.Regex IcRegex = new(
        @"^\d{12}$",
        System.Text.RegularExpressions.RegexOptions.Compiled
    );

    private static readonly System.Text.RegularExpressions.Regex AddressBannedCharsRegex = new(
        @"[%$#@!&*^<>{}|\[\]\\]",
        System.Text.RegularExpressions.RegexOptions.Compiled
    );

    public UpdateProfileValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty()
            .MaximumLength(20)
            .Matches(NameRegex)
            .WithMessage("First name may only contain letters and spaces.");

        RuleFor(x => x.LastName)
            .NotEmpty()
            .MaximumLength(20)
            .Matches(NameRegex)
            .WithMessage("Last name may only contain letters and spaces.");

        When(
            x => !string.IsNullOrEmpty(x.Phone),
            () =>
                RuleFor(x => x.Phone!)
                    .Matches(PhoneRegex)
                    .WithMessage("Phone number must be exactly 10 digits.")
        );

        RuleFor(x => x.IcNumber)
            .NotEmpty()
            .Matches(IcRegex)
            .WithMessage("IC number must be exactly 12 digits.");

        When(
            x => !string.IsNullOrEmpty(x.Address),
            () =>
                RuleFor(x => x.Address!)
                    .MaximumLength(200)
                    .Must(a => !AddressBannedCharsRegex.IsMatch(a))
                    .WithMessage(
                        "Address may not contain special characters like % $ # @ ! & * ^ < > { } | \\ [ ]."
                    )
        );
    }
}
