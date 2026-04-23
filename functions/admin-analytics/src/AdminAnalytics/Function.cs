using System.Collections.Generic;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;

[assembly: LambdaSerializer(
    typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer)
)]

namespace AdminAnalytics;

public class Function
{
    public APIGatewayHttpApiV2ProxyResponse FunctionHandler(
        APIGatewayHttpApiV2ProxyRequest request,
        ILambdaContext context)
    {
        context.Logger.LogInformation("Admin analytics request received.");

        return new APIGatewayHttpApiV2ProxyResponse
        {
            StatusCode = 200,
            Body = "{\"message\": \"Admin analytics OK\"}",
            Headers = new Dictionary<string, string>
            {
                { "Content-Type", "application/json" }
            }
        };
    }
}
