using Bogus;

namespace TeleHealth.Api.Infrastructure.Persistence.Seeding;

/// Shared helpers for all individual faker files.
internal static class SeedFakers
{
    // Malaysian NRIC state-of-birth codes (01–16)
    private static readonly string[] StateCodes =
    [
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
    ];

    // Creates a deterministic Faker instance. Seed is isolated to this instance.
    internal static Faker CreateFaker() => new("en") { Random = new Randomizer(888) };

    /// Generates a plausible Malaysian NRIC: YYMMDD-PB-####
    internal static string GenerateMalaysianIcNumber(Faker f)
    {
        var dob = f.Date.Past(40, DateTime.Now.AddYears(-18));
        var stateCode = f.PickRandom(StateCodes);
        var sequence = f.Random.Number(1000, 9999);

        return $"{dob:yy}{dob:MM}{dob:dd}{stateCode}{sequence}";
    }
}
