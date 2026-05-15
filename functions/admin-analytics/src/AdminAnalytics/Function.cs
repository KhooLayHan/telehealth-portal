using System.Collections.Generic;
using System.Text.Json;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;

[assembly: LambdaSerializer(
    typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer)
)]

namespace AdminAnalytics;

public class Function
{
    private static readonly JsonSerializerOptions s_jsonOptions = new(JsonSerializerDefaults.Web);

    public APIGatewayHttpApiV2ProxyResponse FunctionHandler(
        APIGatewayHttpApiV2ProxyRequest request,
        ILambdaContext context
    )
    {
        context.Logger.LogInformation("Admin analytics request received.");

        var data = new[]
        {
            new ClinicActivityDataPoint("Mon", 18),
            new ClinicActivityDataPoint("Tue", 24),
            new ClinicActivityDataPoint("Wed", 21),
            new ClinicActivityDataPoint("Thu", 32),
            new ClinicActivityDataPoint("Fri", 29),
            new ClinicActivityDataPoint("Sat", 16),
            new ClinicActivityDataPoint("Sun", 12),
        };

        return new APIGatewayHttpApiV2ProxyResponse
        {
            StatusCode = 200,
            Body = JsonSerializer.Serialize(data, s_jsonOptions),
            Headers = new Dictionary<string, string>
            {
                { "Access-Control-Allow-Origin", "*" },
                { "Content-Type", "application/json" },
            },
        };
    }

    private sealed record ClinicActivityDataPoint(string Label, int Appointments);
}
