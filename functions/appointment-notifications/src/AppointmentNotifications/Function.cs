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

namespace AppointmentNotifications;

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

    private const string CancelledType =
        "urn:message:TeleHealth.Contracts:AppointmentCancelledEvent";
    private const string RescheduledType =
        "urn:message:TeleHealth.Contracts:AppointmentRescheduledEvent";

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
                using var doc = JsonDocument.Parse(record.Sns.Message);

                if (!doc.RootElement.TryGetProperty("messageType", out var messageTypeElement))
                {
                    context.Logger.LogWarning("SNS message missing MassTransit 'messageType'.");
                    continue;
                }

                if (!doc.RootElement.TryGetProperty("message", out var messageElement))
                {
                    context.Logger.LogWarning("SNS message missing MassTransit 'message' payload.");
                    continue;
                }

                string? matchedType = null;
                foreach (var typeElement in messageTypeElement.EnumerateArray())
                {
                    var urn = typeElement.GetString();
                    if (urn == CancelledType || urn == RescheduledType)
                    {
                        matchedType = urn;
                        break;
                    }
                }

                if (matchedType is null)
                {
                    context.Logger.LogWarning("Unrecognised messageType — skipping.");
                    continue;
                }

                if (matchedType == CancelledType)
                    await HandleCancelledAsync(sesClient, messageElement, context);
                else
                    await HandleRescheduledAsync(sesClient, messageElement, context);
            }
            catch (Exception ex)
            {
                context.Logger.LogError($"Error processing SNS message: {ex.Message}");
                throw;
            }
        }
    }

    private async Task HandleCancelledAsync(
        AmazonSimpleEmailServiceV2Client sesClient,
        JsonElement messageElement,
        ILambdaContext context
    )
    {
        var evt = JsonSerializer.Deserialize<AppointmentCancelledEvent>(
            messageElement.GetRawText(),
            s_jsonOptions
        );

        if (evt is null)
        {
            context.Logger.LogWarning("Failed to deserialize AppointmentCancelledEvent.");
            return;
        }

        var response = await sesClient.SendEmailAsync(
            new SendEmailRequest
            {
                FromEmailAddress = s_senderEmail,
                Destination = new Destination { ToAddresses = [evt.PatientEmail] },
                Content = new EmailContent
                {
                    Simple = new Message
                    {
                        Subject = new Content
                        {
                            Data = "Your Appointment Has Been Cancelled — TeleHealth Portal",
                        },
                        Body = new Body
                        {
                            Text = new Content
                            {
                                Data =
                                    $"Your appointment has been cancelled.\n\n"
                                    + $"Appointment ID: {evt.AppointmentPublicId}\n"
                                    + $"Reason: {evt.Reason}\n\n"
                                    + $"Please log in to the TeleHealth portal to book a new appointment.",
                            },
                        },
                    },
                },
            }
        );

        context.Logger.LogInformation("===============================================");
        context.Logger.LogInformation("APPOINTMENT CANCELLATION EMAIL SENT");
        context.Logger.LogInformation($"Patient:     {evt.PatientPublicId}");
        context.Logger.LogInformation($"Appointment: {evt.AppointmentPublicId}");
        context.Logger.LogInformation($"SES Message: {response.MessageId}");
        context.Logger.LogInformation("===============================================");
    }

    private async Task HandleRescheduledAsync(
        AmazonSimpleEmailServiceV2Client sesClient,
        JsonElement messageElement,
        ILambdaContext context
    )
    {
        var evt = JsonSerializer.Deserialize<AppointmentRescheduledEvent>(
            messageElement.GetRawText(),
            s_jsonOptions
        );

        if (evt is null)
        {
            context.Logger.LogWarning("Failed to deserialize AppointmentRescheduledEvent.");
            return;
        }

        var response = await sesClient.SendEmailAsync(
            new SendEmailRequest
            {
                FromEmailAddress = s_senderEmail,
                Destination = new Destination { ToAddresses = [evt.PatientEmail] },
                Content = new EmailContent
                {
                    Simple = new Message
                    {
                        Subject = new Content
                        {
                            Data = "Your Appointment Has Been Rescheduled — TeleHealth Portal",
                        },
                        Body = new Body
                        {
                            Text = new Content
                            {
                                Data =
                                    $"Your appointment has been rescheduled.\n\n"
                                    + $"Appointment ID: {evt.AppointmentPublicId}\n"
                                    + $"Previous: {evt.OldDate} at {evt.OldTime}\n"
                                    + $"New:      {evt.NewDate} at {evt.NewTime}\n\n"
                                    + $"Please log in to the TeleHealth portal to view full details.",
                            },
                        },
                    },
                },
            }
        );

        context.Logger.LogInformation("===============================================");
        context.Logger.LogInformation("APPOINTMENT RESCHEDULE EMAIL SENT");
        context.Logger.LogInformation($"Patient:     {evt.PatientPublicId}");
        context.Logger.LogInformation($"Appointment: {evt.AppointmentPublicId}");
        context.Logger.LogInformation($"SES Message: {response.MessageId}");
        context.Logger.LogInformation("===============================================");
    }
}
