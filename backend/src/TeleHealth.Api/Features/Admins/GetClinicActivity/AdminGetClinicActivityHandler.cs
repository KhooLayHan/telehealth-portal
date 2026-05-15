using System.Net.Http.Json;
using System.Text.Json;
using Serilog;
using TeleHealth.Api.Common.Exceptions;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Features.Admins.GetClinicActivity;

// Calls the serverless admin analytics API used by the dashboard chart.
public sealed class AdminGetClinicActivityHandler(
    HttpClient httpClient,
    IConfiguration configuration
)
{
    private static readonly JsonSerializerOptions s_jsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<IReadOnlyList<AdminClinicActivityDataPointDto>> HandleAsync(
        CancellationToken ct
    )
    {
        var baseUri = GetAdminAnalyticsBaseUri();
        var requestUri = new Uri(baseUri, "admin/clinic-activity");

        using var response = await httpClient.GetAsync(requestUri, ct);

        if (!response.IsSuccessStatusCode)
        {
            Log.Warning(
                "Admin analytics API returned an unsuccessful status code. StatusCode: {StatusCode}",
                (int)response.StatusCode
            );
            throw AnalyticsUnavailableException();
        }

        var data = await response.Content.ReadFromJsonAsync<
            IReadOnlyList<AdminClinicActivityDataPointDto>
        >(s_jsonOptions, ct);

        return data ?? [];
    }

    private Uri GetAdminAnalyticsBaseUri()
    {
        var configuredUrl =
            configuration["ADMIN_ANALYTICS_API_BASE_URL"]
            ?? configuration["Aws:AdminAnalytics:ApiBaseUrl"];

        if (string.IsNullOrWhiteSpace(configuredUrl))
        {
            Log.Warning("Admin analytics API base URL is not configured.");
            throw new InternalServerException(
                SystemErrorCodes.ConfigurationMissing,
                "Analytics Configuration Missing",
                "Admin analytics are not configured."
            );
        }

        if (!configuredUrl.EndsWith('/'))
        {
            configuredUrl += "/";
        }

        if (!Uri.TryCreate(configuredUrl, UriKind.Absolute, out var baseUri))
        {
            Log.Warning("Admin analytics API base URL is invalid.");
            throw AnalyticsUnavailableException();
        }

        return baseUri;
    }

    private static InternalServerException AnalyticsUnavailableException()
    {
        return new InternalServerException(
            SystemErrorCodes.ExternalServiceUnavailable,
            "Analytics Unavailable",
            "Clinic activity analytics are unavailable."
        );
    }
}
