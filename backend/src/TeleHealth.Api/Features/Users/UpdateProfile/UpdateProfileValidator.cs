using FluentValidation;
using NodaTime;

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

    private static readonly System.Text.RegularExpressions.Regex UsernameRegex = new(
        @"^[a-zA-Z0-9_]+$",
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
            x => !string.IsNullOrEmpty(x.Username),
            () =>
                RuleFor(x => x.Username!)
                    .MinimumLength(3)
                    .MaximumLength(50)
                    .Matches(UsernameRegex)
                    .WithMessage("Username may only contain letters, numbers, and underscores.")
        );

        When(
            x => x.DateOfBirth.HasValue,
            () =>
                RuleFor(x => x.DateOfBirth!.Value)
                    .LessThanOrEqualTo(SystemClock.Instance.GetCurrentInstant().InUtc().Date)
                    .WithMessage("Date of birth cannot be in the future.")
        );

        When(
            x => !string.IsNullOrEmpty(x.Gender),
            () =>
                RuleFor(x => x.Gender!)
                    .Must(g => g is "male" or "female" or "other" or "M" or "F" or "O" or "N")
                    .WithMessage("Gender must be male, female, or other.")
        );

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

        When(
            x => !string.IsNullOrEmpty(x.AddressLine1),
            () => RuleFor(x => x.AddressLine1!).MaximumLength(200).Must(IsAddressSafe)
        );

        When(
            x => !string.IsNullOrEmpty(x.AddressLine2),
            () => RuleFor(x => x.AddressLine2!).MaximumLength(200).Must(IsAddressSafe)
        );

        When(
            x => !string.IsNullOrEmpty(x.City),
            () => RuleFor(x => x.City!).MaximumLength(100).Matches(NameRegex)
        );

        When(
            x => !string.IsNullOrEmpty(x.State),
            () => RuleFor(x => x.State!).MaximumLength(100).Matches(NameRegex)
        );

        When(
            x => !string.IsNullOrEmpty(x.PostalCode),
            () => RuleFor(x => x.PostalCode!).MaximumLength(20)
        );

        When(
            x => !string.IsNullOrEmpty(x.Country),
            () => RuleFor(x => x.Country!).MaximumLength(100).Matches(NameRegex)
        );
    }

    private static bool IsAddressSafe(string value) => !AddressBannedCharsRegex.IsMatch(value);
}
