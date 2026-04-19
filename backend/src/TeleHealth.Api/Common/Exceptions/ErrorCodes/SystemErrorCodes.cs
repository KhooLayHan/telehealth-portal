namespace TeleHealth.Api.Common.Exceptions.ErrorCodes;

public static class SystemErrorCodes
{
    public const string ValidationFailed = "System.ValidationFailed";
    public const string DatabaseConnection = "System.DatabaseConnection";
    public const string DatabaseTimeout = "System.DatabaseTimeout";
    public const string ExternalServiceUnavailable = "System.ExternalServiceUnavailable";
    public const string ConfigurationMissing = "System.ConfigurationMissing";
    public const string Unexpected = "System.Unexpected";
}