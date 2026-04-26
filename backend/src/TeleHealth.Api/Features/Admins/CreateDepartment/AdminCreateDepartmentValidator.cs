using FluentValidation;

namespace TeleHealth.Api.Features.Admins.CreateDepartment;

// Validates department details before an admin can create one.
public sealed class AdminCreateDepartmentValidator : AbstractValidator<AdminCreateDepartmentCommand>
{
    public AdminCreateDepartmentValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(500).When(x => x.Description is not null);
    }
}
