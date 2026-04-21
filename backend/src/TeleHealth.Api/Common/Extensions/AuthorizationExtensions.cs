using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Common.Extensions;

public static class AuthorizationExtensions
{
    public static IServiceCollection AddAuthorizationPolicies(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            options.AddPolicy(
                AuthConstants.ReceptionistPolicy,
                policy => policy.RequireRole("receptionist")
            );
            options.AddPolicy(AuthConstants.AdminPolicy, policy => policy.RequireRole("admin"));
            options.AddPolicy(
                AuthConstants.AdminOrReceptionistPolicy,
                policy => policy.RequireRole("admin", "receptionist")
            );
            options.AddPolicy(AuthConstants.DoctorPolicy, policy => policy.RequireRole("doctor"));
            options.AddPolicy(AuthConstants.PatientPolicy, policy => policy.RequireRole("patient"));
            options.AddPolicy(
                AuthConstants.LabTechPolicy,
                policy => policy.RequireRole("lab-tech")
            );
            options.AddPolicy(
                AuthConstants.ClinicStaffPolicy,
                policy => policy.RequireRole("admin", "doctor", "receptionist", "lab-tech")
            );
        });

        return services;
    }
}
