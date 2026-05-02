using Bogus;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Seeding.Fakers;

internal static class PrescriptionFaker
{
    private static readonly (
        string Name,
        string Dosage,
        string Freq,
        int Days,
        string TakeWith,
        string[] Warnings
    )[] Medications =
    [
        ("Paracetamol", "500mg", "TDS", 5, "food or water", ["Avoid alcohol"]),
        (
            "Ibuprofen",
            "400mg",
            "TDS",
            5,
            "food",
            ["Avoid on empty stomach", "Not for kidney disease"]
        ),
        (
            "Amoxicillin",
            "500mg",
            "TDS",
            7,
            "food or water",
            ["Complete full course", "May cause diarrhoea"]
        ),
        ("Omeprazole", "20mg", "OD", 14, "before meals", ["Take 30 min before breakfast"]),
        (
            "Metformin",
            "500mg",
            "BD",
            30,
            "food",
            ["Monitor blood sugar", "Report lactic acidosis symptoms"]
        ),
        ("Amlodipine", "5mg", "OD", 30, "any time", ["May cause ankle swelling"]),
        (
            "Simvastatin",
            "20mg",
            "ON",
            90,
            "evening meal",
            ["Avoid grapefruit juice", "Report muscle pain"]
        ),
        ("Cetirizine", "10mg", "OD", 14, "water", ["May cause drowsiness"]),
        (
            "Salbutamol",
            "100mcg",
            "PRN",
            30,
            "inhaler only",
            ["Shake before use", "Rinse mouth after"]
        ),
        (
            "Prednisolone",
            "5mg",
            "OD",
            7,
            "food",
            ["Do not stop abruptly", "Monitor blood pressure"]
        ),
        (
            "Atorvastatin",
            "40mg",
            "ON",
            90,
            "evening meal",
            ["Report muscle pain", "Avoid grapefruit juice"]
        ),
        (
            "Aspirin",
            "100mg",
            "OD",
            30,
            "food and water",
            ["May cause stomach irritation", "Inform dentist"]
        ),
    ];

    internal static List<Prescription> BuildPrescriptions(
        Faker faker,
        List<Consultation> consultations
    )
    {
        var prescriptions = new List<Prescription>();

        foreach (var consultation in consultations)
        {
            var count = faker.Random.Int(2, 3);
            var picked = faker.PickRandom(Medications, count).Distinct().Take(count);

            foreach (var (name, dosage, freq, days, takeWith, warnings) in picked)
            {
                prescriptions.Add(
                    new Prescription
                    {
                        PublicId = Guid.NewGuid(),
                        ConsultationId = consultation.Id,
                        MedicationName = name,
                        Dosage = dosage,
                        Frequency = freq,
                        DurationDays = (short)days,
                        Instructions = new Instruction(
                            TakeWith: takeWith,
                            Warnings: [.. warnings],
                            Storage: "Room temperature, away from moisture",
                            MissedDose: "Take as soon as remembered unless close to next dose"
                        ),
                    }
                );
            }
        }

        return prescriptions;
    }
}
