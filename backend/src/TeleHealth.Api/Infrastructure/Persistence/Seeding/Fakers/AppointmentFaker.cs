using Bogus;
using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Seeding.Fakers;

internal static class AppointmentFaker
{
    internal static (
        List<Appointment> Appointments,
        List<long> TouchedScheduleIds
    ) BuildAppointments(
        Faker faker,
        List<Doctor> doctors,
        List<Patient> patients,
        List<DoctorSchedule> schedules,
        User createdByUser,
        Dictionary<string, AppointmentStatus> appointmentStatuses
    )
    {
        var now = SystemClock.Instance.GetCurrentInstant();
        var today = now.InUtc().Date;

        var completedAppointmentStatusId = appointmentStatuses["completed"].Id;
        var bookedAppointmentStatusId = appointmentStatuses["booked"].Id;
        var cancelledAppointmentStatusId = appointmentStatuses["cancelled"].Id;

        var appointments = new List<Appointment>();
        var touchedScheduleIds = new List<long>();

        static Appointment MakeAppointment(
            Guid publicId,
            long patientId,
            long doctorId,
            long scheduleId,
            int statusId,
            long createdById,
            string visitReason,
            Instant? checkIn = null,
            string? cancellationReason = null,
            List<Symptom>? symptoms = null
        ) =>
            new()
            {
                PublicId = publicId,
                Slug = $"apt-{publicId.ToString()[..8]}",
                PatientId = patientId,
                DoctorId = doctorId,
                ScheduleId = scheduleId,
                StatusId = statusId,
                CreatedByUserId = createdById,
                VisitReason = visitReason,
                CheckInDateTime = checkIn,
                CancellationReason = cancellationReason,
                Symptoms = symptoms,
            };

        List<Symptom>[] symptomSets =
        [
            [
                new Symptom
                {
                    Name = "Fever",
                    Severity = "Moderate",
                    Duration = "3 days",
                },
                new Symptom
                {
                    Name = "Cough",
                    Severity = "Mild",
                    Duration = "5 days",
                },
            ],
            [
                new Symptom
                {
                    Name = "Chest pain",
                    Severity = "Severe",
                    Duration = "1 day",
                },
            ],
            [
                new Symptom
                {
                    Name = "Fatigue",
                    Severity = "Mild",
                    Duration = "1 week",
                },
                new Symptom
                {
                    Name = "Headache",
                    Severity = "Moderate",
                    Duration = "2 days",
                },
            ],
            [
                new Symptom
                {
                    Name = "Skin rash",
                    Severity = "Moderate",
                    Duration = "4 days",
                },
            ],
            [
                new Symptom
                {
                    Name = "Nausea",
                    Severity = "Mild",
                    Duration = "2 days",
                },
                new Symptom
                {
                    Name = "Dizziness",
                    Severity = "Mild",
                    Duration = "1 day",
                },
            ],
            [
                new Symptom
                {
                    Name = "Joint pain",
                    Severity = "Moderate",
                    Duration = "2 weeks",
                },
            ],
            [],
        ];

        var symptomIndex = 0;

        // Completed (past) — ~40 completed appointments
        var pastSchedules = schedules.Where(s => s.Date < today).Take(40).ToList();

        foreach (var schedule in pastSchedules)
        {
            var publicId = Guid.NewGuid();
            var symptoms = symptomSets[symptomIndex % symptomSets.Length];
            symptomIndex++;

            appointments.Add(
                MakeAppointment(
                    publicId,
                    faker.PickRandom(patients).Id,
                    doctors.First(d => d.Id == schedule.DoctorId).Id,
                    schedule.Id,
                    completedAppointmentStatusId,
                    createdByUser.Id,
                    faker.PickRandom(
                        "Routine checkup",
                        "Follow-up visit",
                        "Chest pain",
                        "Fever and cough",
                        "Skin rash",
                        "Diabetes management",
                        "Hypertension review",
                        "Knee pain"
                    ),
                    checkIn: now.Minus(Duration.FromDays(faker.Random.Int(1, 3))),
                    symptoms: symptoms.Count > 0 ? symptoms : null
                )
            );

            touchedScheduleIds.Add(schedule.Id);
        }

        // Upcoming (booked) — 20 future appointments
        var upcomingSchedules = schedules.Where(s => s.Date > today).Take(20).ToList();

        foreach (var schedule in upcomingSchedules)
        {
            var publicId = Guid.NewGuid();
            appointments.Add(
                MakeAppointment(
                    publicId,
                    faker.PickRandom(patients).Id,
                    doctors.First(d => d.Id == schedule.DoctorId).Id,
                    schedule.Id,
                    bookedAppointmentStatusId,
                    createdByUser.Id,
                    faker.PickRandom(
                        "Annual health screening",
                        "Blood pressure review",
                        "Diabetes follow-up",
                        "Vaccination",
                        "Skin consultation",
                        "Neurology review",
                        "General checkup"
                    )
                )
            );

            touchedScheduleIds.Add(schedule.Id);
        }

        // Cancelled — 5 cancelled appointments
        var cancelledSchedules = schedules
            .Where(s => s.Date >= today)
            .Skip(upcomingSchedules.Count)
            .Take(5)
            .ToList();

        foreach (var cancelledSchedule in cancelledSchedules)
        {
            var publicId = Guid.NewGuid();
            appointments.Add(
                MakeAppointment(
                    publicId,
                    faker.PickRandom(patients).Id,
                    doctors.First(d => d.Id == cancelledSchedule.DoctorId).Id,
                    cancelledSchedule.Id,
                    cancelledAppointmentStatusId,
                    createdByUser.Id,
                    "General consultation",
                    cancellationReason: faker.PickRandom(
                        "Patient requested cancellation",
                        "Doctor unavailable",
                        "Patient did not show up",
                        "Rescheduled to another date"
                    )
                )
            );
            // Cancelled slot reverts to available — no status mutation needed
        }

        return (appointments, touchedScheduleIds);
    }
}
