namespace TeleHealth.Api.Common.Exceptions.Seeding;

public class SeedingException : Exception
{
    public SeedingException(string message, Exception? innerException = null)
        : base(message, innerException) { }
}