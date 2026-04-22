using System;
using System.Text.Json;
using System.Threading.Tasks;
using Amazon.Lambda.Core;
using Amazon.Lambda.SQSEvents;
using NodaTime;
using NodaTime.Serialization.SystemTextJson;
using TeleHealth.Contracts;

// Assembly attribute must be on its own line
[assembly: LambdaSerializer(
    typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer)
)]

namespace LabPdfProcessor_dev_ProcessPdfDocument;

public class Function
{
    private static readonly JsonSerializerOptions s_jsonOptions = new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true,
    }.ConfigureForNodaTime(DateTimeZoneProviders.Tzdb);

    public async Task FunctionHandler(SQSEvent evnt, ILambdaContext context)
    {
        foreach (var record in evnt.Records)
        {
            context.Logger.LogInformation($"Processing SQS message ID: {record.MessageId}");

            try
            {
                // SNS→SQS adds an outer envelope: parse the SNS "Message" field first
                using var sqsDocument = JsonDocument.Parse(record.Body);

                if (!sqsDocument.RootElement.TryGetProperty("Message", out var snsMessage))
                {
                    context.Logger.LogWarning("SQS body is not an SNS notification envelope.");
                    continue;
                }

                // Now unwrap the MassTransit envelope inside the SNS message
                using var massTransitDocument = JsonDocument.Parse(snsMessage.GetString()!);

                if (
                    !massTransitDocument.RootElement.TryGetProperty(
                        "message",
                        out var messageElement
                    )
                )
                {
                    context.Logger.LogWarning(
                        "SNS message did not contain a MassTransit 'message' payload."
                    );
                    continue;
                }

                var labEvent = JsonSerializer.Deserialize<LabReportCompletedEvent>(
                    messageElement.GetRawText(),
                    s_jsonOptions
                );

                if (labEvent is null)
                {
                    context.Logger.LogWarning("Failed to deserialize LabReportCompletedEvent.");
                    continue;
                }

                context.Logger.LogInformation("===============================================");
                context.Logger.LogInformation("NOTIFICATION MICROSERVICE TRIGGERED");
                context.Logger.LogInformation($"To: {labEvent.PatientEmail}");
                context.Logger.LogInformation(
                    $"Subject: Your {labEvent.ReportType} Results are Ready!"
                );
                context.Logger.LogInformation(
                    $"Body: Hello {labEvent.PatientName}, your lab results have been processed and are now securely available in your TeleHealth portal."
                );
                context.Logger.LogInformation("===============================================");
            }
            catch (Exception ex)
            {
                context.Logger.LogError($"Error processing SQS message: {ex.Message}");
                throw; // Signals SQS to retry and eventually route to DLQ
            }
        }
    }
}
