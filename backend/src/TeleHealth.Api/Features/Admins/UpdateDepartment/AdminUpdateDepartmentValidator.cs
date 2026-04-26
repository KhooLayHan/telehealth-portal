using FluentValidation;

namespace TeleHealth.Api.Features.Admins.UpdateDepartment;

// Validates the admin department update command before it reaches the handler.
public sealed class AdminUpdateDepartmentValidator : AbstractValidator<AdminUpdateDepartmentCommand>
{
    public AdminUpdateDepartmentValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(500).When(x => x.Description is not null);
    }
}
