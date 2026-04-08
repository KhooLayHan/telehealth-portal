namespace TeleHealth.Contracts;

public record UserCreatedEvent(Guid UserPublicId, string Username, string Email);
