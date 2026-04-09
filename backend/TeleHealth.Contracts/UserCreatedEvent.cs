using NodaTime;

namespace TeleHealth.Contracts;

public record UserCreatedEvent(Guid PublicId, Instant? OccurredAt);
