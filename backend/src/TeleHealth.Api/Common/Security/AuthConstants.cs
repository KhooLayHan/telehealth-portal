namespace TeleHealth.Api.Common.Security;

public static class AuthConstants
{
    // Policies
    public const string AdminPolicy = "AdminPolicy";
    public const string DoctorPolicy = "DoctorPolicy";
    public const string PatientPolicy = "PatientPolicy";
    public const string LabTechPolicy = "LabTechPolicy";
    public const string ReceptionistPolicy = "ReceptionistPolicy";
    public const string AdminOrReceptionistPolicy = "AdminOrReceptionistPolicy";
    public const string AnyRole = "AnyRolePolicy";

    // Standard Claim Types
    public const string RoleClaim = "role";
    public const string PublicIdClaim = "public_id";

    // API Keys
    public const string ApiKeyHeaderName = "x-api-key";
}