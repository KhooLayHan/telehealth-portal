namespace TeleHealth.Contracts;

public sealed record PatientRegisteredEvent(Guid PublicId, string Email, string FirstName);
