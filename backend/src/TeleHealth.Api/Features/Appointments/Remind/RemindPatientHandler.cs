using Amazon.SimpleEmailV2;
using Amazon.SimpleEmailV2.Model;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Appointments.Remind;

public sealed class RemindPatientHandler(ApplicationDbContext db)
{
    public async Task<Results<NoContent, NotFound>> HandleAsync(Guid id, CancellationToken ct)
    {
        var appointment = await db
            .Appointments.Include(a => a.Patient)
                .ThenInclude(p => p.User)
            .Include(a => a.DoctorSchedule)
            .FirstOrDefaultAsync(a => a.PublicId == id, ct);

        if (appointment is null)
            return TypedResults.NotFound();

        var senderEmail = Environment.GetEnvironmentVariable("SES_SENDER_EMAIL") ?? string.Empty;
        var sesRegion = Environment.GetEnvironmentVariable("SES_REGION") ?? "us-east-1";

        using var ses = new AmazonSimpleEmailServiceV2Client(
            Amazon.RegionEndpoint.GetBySystemName(sesRegion)
        );

        await ses.SendEmailAsync(
            new SendEmailRequest
            {
                FromEmailAddress = senderEmail,
                Destination = new Destination { ToAddresses = [appointment.Patient.User.Email] },
                Content = new EmailContent
                {
                    Simple = new Message
                    {
                        Subject = new Content { Data = "Appointment Reminder — TeleHealth Portal" },
                        Body = new Body
                        {
                            Text = new Content
                            {
                                Data =
                                    $"This is a reminder about your upcoming appointment.\n\n"
                                    + $"Appointment ID: {appointment.PublicId}\n"
                                    + $"Date: {appointment.DoctorSchedule.Date}\n"
                                    + $"Time: {appointment.DoctorSchedule.StartTime} – {appointment.DoctorSchedule.EndTime}\n\n"
                                    + $"Please arrive 10 minutes early. Log in to the TeleHealth portal to view full details.",
                            },
                        },
                    },
                },
            },
            ct
        );

        return TypedResults.NoContent();
    }
}
