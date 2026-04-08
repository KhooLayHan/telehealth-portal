using NodaTime;

namespace TeleHealth.Contracts;

public sealed record PatientRegisteredEvent(Guid PublicId, Instant OccuredAt);
