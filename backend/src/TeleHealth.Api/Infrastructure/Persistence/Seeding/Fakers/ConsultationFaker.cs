using Bogus;
using NodaTime;
using Slugify;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Seeding.Fakers;

internal static class ConsultationFaker
{
    internal static List<Consultation> BuildConsultations(
        Faker faker,
        List<Appointment> appointments,
        SlugHelper slugHelper
    ) =>
        appointments
            .Where(a => a.StatusId == Common.Constants.StatusId.Appointment.Completed)
            .Select(appointment =>
            {
                var publicId = Guid.NewGuid();
                var shortId = publicId.ToString()[..8];

                return new Consultation
                {
                    PublicId = publicId,
                    Slug = slugHelper.GenerateSlug($"cons-{shortId}"),
                    AppointmentId = appointment.Id,
                    ConsultationNotes = new ConsultationNote(
                        Subjective: faker.Lorem.Sentence(12),
                        Objective: $"BP: {faker.Random.Number(110, 140)}/{faker.Random.Number(70, 90)}, "
                            + $"HR: {faker.Random.Number(60, 100)}, "
                            + $"Temp: {faker.Random.Double(36.1, 37.5):F1}C",
                        Assessment: faker.PickRandom(
                            "Hypertension, well controlled.",
                            "Upper respiratory tract infection.",
                            "Type 2 diabetes, follow-up required.",
                            "Musculoskeletal pain, likely mechanical.",
                            "Allergic rhinitis.",
                            "Dyslipidaemia, diet modification advised.",
                            "Anxiety disorder, mild.",
                            "Viral fever, supportive care."
                        ),
                        Plan: faker.Lorem.Sentence(10)
                    ),
                    ConsultationDateTime =
                        appointment.CheckInDateTime ?? SystemClock.Instance.GetCurrentInstant(),
                    FollowUpDate = faker.Random.Bool(0.5f)
                        ? SystemClock
                            .Instance.GetCurrentInstant()
                            .InUtc()
                            .Date.PlusDays(faker.Random.Number(7, 30))
                        : null,
                };
            })
            .ToList();
}
