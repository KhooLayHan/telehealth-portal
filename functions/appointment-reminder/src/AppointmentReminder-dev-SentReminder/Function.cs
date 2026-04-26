using System;
using System.Text.Json;
using System.Threading.Tasks;
using Amazon.Lambda.Core;
using Amazon.Lambda.SNSEvents;
using Amazon.SimpleEmailV2;
using Amazon.SimpleEmailV2.Model;
using NodaTime;
using NodaTime.Serialization.SystemTextJson;
using TeleHealth.Contracts;

[assembly: LambdaSerializer(
    typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer)
)]

namespace AppointmentReminder_dev_SentReminder;

public class Function
{
    private static readonly JsonSerializerOptions s_jsonOptions = new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true,
    }.ConfigureForNodaTime(DateTimeZoneProviders.Tzdb);

    private static readonly string s_sesRegion =
        Environment.GetEnvironmentVariable("SES_REGION") ?? "us-east-1";

    private static readonly string s_senderEmail =
        Environment.GetEnvironmentVariable("SES_SENDER_EMAIL") ?? string.Empty;

    public async Task FunctionHandler(SNSEvent evnt, ILambdaContext context)
    {
        using var sesClient = new AmazonSimpleEmailServiceV2Client(
            Amazon.RegionEndpoint.GetBySystemName(s_sesRegion)
        );

        foreach (var record in evnt.Records)
        {
            context.Logger.LogInformation($"Processing SNS message ID: {record.Sns.MessageId}");

            try
            {
                // SNS delivers the MassTransit envelope in record.Sns.Message
                using var doc = JsonDocument.Parse(record.Sns.Message);

                if (!doc.RootElement.TryGetProperty("message", out var messageElement))
                {
                    context.Logger.LogWarning(
                        "SNS message did not contain a MassTransit 'message' payload."
                    );
                    continue;
                }

                var bookedEvent = JsonSerializer.Deserialize<AppointmentBookedEvent>(
                    messageElement.GetRawText(),
                    s_jsonOptions
                );

                if (bookedEvent is null)
                {
                    context.Logger.LogWarning("Failed to deserialize AppointmentBookedEvent.");
                    continue;
                }

                var response = await sesClient.SendEmailAsync(
                    new SendEmailRequest
                    {
                        FromEmailAddress = s_senderEmail,
                        Destination = new Destination { ToAddresses = [bookedEvent.PatientEmail] },
                        Content = new EmailContent
                        {
                            Simple = new Message
                            {
                                Subject = new Content
                                {
                                    Data = "Appointment Confirmed — TeleHealth Portal",
                                },
                                Body = new Body
                                {
                                    Text = new Content
                                    {
                                        Data =
                                            $"Your appointment has been confirmed.\n\n"
                                            + $"Appointment ID: {bookedEvent.AppointmentPublicId}\n"
                                            + $"Booked on: {bookedEvent.OccurredAt}\n\n"
                                            + $"Please arrive 10 minutes early. Log in to the TeleHealth portal to view full details.",
                                    },
                                },
                            },
                        },
                    }
                );

                context.Logger.LogInformation("===============================================");
                context.Logger.LogInformation("APPOINTMENT CONFIRMATION EMAIL SENT");
                context.Logger.LogInformation($"To:          {bookedEvent.PatientEmail}");
                context.Logger.LogInformation($"Patient:     {bookedEvent.PatientPublicId}");
                context.Logger.LogInformation($"Appointment: {bookedEvent.AppointmentPublicId}");
                context.Logger.LogInformation($"SES Message: {response.MessageId}");
                context.Logger.LogInformation("===============================================");
            }
            catch (Exception ex)
            {
                context.Logger.LogError($"Error processing SNS message: {ex.Message}");
                throw;
            }
        }
    }
}
