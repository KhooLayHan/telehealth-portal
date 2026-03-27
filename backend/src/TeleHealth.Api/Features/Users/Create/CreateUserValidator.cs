using FluentValidation;
using NodaTime;

namespace TeleHealth.Api.Features.Users.CreateUser;

public class CreateUserValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.Username).NotEmpty().MaximumLength(50);

        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);

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

        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);

        RuleFor(x => x.Gender)
            .Must(g => g is 'M' or 'F' or 'O' or 'N')
            .WithMessage("Gender must be one of M, F, O, or N.");

        RuleFor(x => x.DateOfBirth)
            .Must(dob => dob <= SystemClock.Instance.GetCurrentInstant().InUtc().Date)
            .WithMessage("Date of birth cannot be in the future.");

        RuleFor(x => x.IcNumber)
            .Matches(@"^\d{12}$")
            .WithMessage("Malaysian IC Number must be exactly 12 digits without dashes.");
    }
}
