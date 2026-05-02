using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Users;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Users.UpdateProfile;

public sealed record UpdateProfileResult(
    string FirstName,
    string LastName,
    string? Username,
    string? Phone,
    string IcNumber,
    LocalDate? DateOfBirth,
    string? Gender,
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? State,
    string? PostalCode,
    string? Country
);

public sealed class UpdateProfileHandler(ApplicationDbContext db)
{
    public async Task<UpdateProfileResult> HandleAsync(
        Guid publicId,
        UpdateProfileCommand cmd,
        CancellationToken ct
    )
    {
        Log.Information("Updating profile. UserId: {UserId}", publicId);

        var user = await db.Users.FirstOrDefaultAsync(u => u.PublicId == publicId, ct);

        if (user is null)
            throw new UserNotFoundException(publicId);

        if (
            !string.IsNullOrWhiteSpace(cmd.Username)
            && !string.Equals(user.Username, cmd.Username, StringComparison.Ordinal)
            && await db.Users.AnyAsync(
                u => u.Username == cmd.Username && u.PublicId != publicId && u.DeletedAt == null,
                ct
            )
        )
        {
            throw new DuplicateUsernameException();
        }

        if (
            !string.Equals(user.IcNumber, cmd.IcNumber, StringComparison.Ordinal)
            && await db.Users.AnyAsync(
                u => u.IcNumber == cmd.IcNumber && u.PublicId != publicId && u.DeletedAt == null,
                ct
            )
        )
        {
            throw new DuplicateIcNumberException();
        }

        user.FirstName = cmd.FirstName;
        user.LastName = cmd.LastName;
        user.Username = string.IsNullOrWhiteSpace(cmd.Username) ? user.Username : cmd.Username;
        user.Phone = string.IsNullOrEmpty(cmd.Phone) ? null : cmd.Phone;
        user.IcNumber = cmd.IcNumber;
        user.DateOfBirth = cmd.DateOfBirth ?? user.DateOfBirth;
        user.Gender = string.IsNullOrWhiteSpace(cmd.Gender)
            ? user.Gender
            : ToGenderCode(cmd.Gender);
        user.Address = BuildAddress(cmd);
        user.UpdatedAt = SystemClock.Instance.GetCurrentInstant();

        await db.SaveChangesAsync(ct);

        Log.Information("Profile update successful. UserId: {UserId}", publicId);

        return new UpdateProfileResult(
            user.FirstName,
            user.LastName,
            user.Username,
            user.Phone,
            user.IcNumber,
            user.DateOfBirth,
            ToGenderLabel(user.Gender),
            user.Address?.Street,
            null,
            user.Address?.City,
            user.Address?.State,
            user.Address?.PostalCode,
            user.Address?.Country
        );
    }

    private static Address? BuildAddress(UpdateProfileCommand cmd)
    {
        var street = FirstNonEmpty(cmd.AddressLine1, cmd.Address);
        var hasAddress =
            !string.IsNullOrWhiteSpace(street)
            || !string.IsNullOrWhiteSpace(cmd.City)
            || !string.IsNullOrWhiteSpace(cmd.State)
            || !string.IsNullOrWhiteSpace(cmd.PostalCode)
            || !string.IsNullOrWhiteSpace(cmd.Country);

        return hasAddress
            ? new Address(
                street ?? "-",
                EmptyToPlaceholder(cmd.City),
                EmptyToPlaceholder(cmd.State),
                EmptyToPlaceholder(cmd.PostalCode),
                EmptyToPlaceholder(cmd.Country)
            )
            : null;
    }

    private static string? FirstNonEmpty(params string?[] values) =>
        values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));

    private static string EmptyToPlaceholder(string? value) =>
        string.IsNullOrWhiteSpace(value) ? "-" : value;

    private static char ToGenderCode(string gender) =>
        gender switch
        {
            "male" or "M" => 'M',
            "female" or "F" => 'F',
            "other" or "O" => 'O',
            "N" => 'N',
            _ => 'N',
        };

    private static string ToGenderLabel(char gender) =>
        gender switch
        {
            'M' => "male",
            'F' => "female",
            'O' => "other",
            _ => "other",
        };
}
