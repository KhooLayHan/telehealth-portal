using Bogus;
using NodaTime;
using Slugify;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Seeding.Fakers;

internal static class LabReportFaker
{
    private static readonly string[] ReportTypes =
    [
        "Full Blood Count",
        "Liver Function Test",
        "Lipid Panel",
        "HbA1c",
        "Renal Function Test",
        "Thyroid Function Test",
        "Urine Full Examination",
        "Fasting Blood Glucose",
    ];

    internal static List<LabReport> BuildLabReports(
        Faker faker,
        List<Consultation> consultations,
        List<Appointment> appointments,
        List<Patient> patients,
        Dictionary<string, LabReportStatus> labReportStatuses,
        SlugHelper slugHelper
    )
    {
        var now = SystemClock.Instance.GetCurrentInstant();
        var labReports = new List<LabReport>();

        // Completed reports — one per consultation (linked)
        foreach (var consultation in consultations)
        {
            var reportType = faker.PickRandom(ReportTypes);
            var publicId = Guid.NewGuid();
            var slug = slugHelper.GenerateSlug($"lab-{publicId.ToString()[..8]}");
            var patientId = appointments.First(a => a.Id == consultation.AppointmentId).PatientId;
            var uploadedAt = now.Minus(Duration.FromDays(faker.Random.Int(1, 10)));

            labReports.Add(
                new LabReport
                {
                    PublicId = publicId,
                    Slug = slug,
                    ConsultationId = consultation.Id,
                    PatientId = patientId,
                    StatusId = labReportStatuses["completed"].Id,
                    ReportType = reportType,
                    S3ObjectKey =
                        $"lab-reports/{uploadedAt.InUtc().Year}/{uploadedAt.InUtc().Month:D2}/{slug}.pdf",
                    FileName = $"{reportType.Replace(" ", "_")}_{uploadedAt.InUtc().Date}.pdf",
                    FileSizeBytes = faker.Random.Long(500_000, 5_000_000),
                    Biomarkers = GenerateBiomarkers(faker, reportType),
                    UploadedAt = uploadedAt,
                }
            );
        }

        // Pending reports — standalone (not yet linked to a consultation)
        const int pendingCount = 10;
        for (var i = 0; i < pendingCount; i++)
        {
            var reportType = faker.PickRandom(ReportTypes);
            var publicId = Guid.NewGuid();
            var slug = slugHelper.GenerateSlug($"lab-{publicId.ToString()[..8]}");

            labReports.Add(
                new LabReport
                {
                    PublicId = publicId,
                    Slug = slug,
                    ConsultationId = null,
                    PatientId = faker.PickRandom(patients).Id,
                    StatusId = labReportStatuses["pending"].Id,
                    ReportType = reportType,
                    S3ObjectKey = null,
                    FileName = null,
                    FileSizeBytes = null,
                    Biomarkers = null,
                    UploadedAt = null,
                }
            );
        }

        return labReports;
    }

    /// Generates realistic biomarkers for the given report type.
    private static List<Biomarker> GenerateBiomarkers(Faker faker, string reportType)
    {
        switch (reportType)
        {
            case "Full Blood Count":
                var hb = faker.Random.Double(11.5, 17.5);
                var wbc = faker.Random.Double(4.0, 11.0);
                return
                [
                    new(
                        "Haemoglobin",
                        $"{hb:F1}",
                        "g/dL",
                        "12.0-17.5",
                        hb < 12.0 ? "low" : "normal"
                    ),
                    new("White Blood Cells", $"{wbc:F1}", "10⁹/L", "4.0-11.0", "normal"),
                    new("Platelets", $"{faker.Random.Int(150, 400)}", "10⁹/L", "150-400", "normal"),
                    new("Haematocrit", $"{faker.Random.Double(36, 50):F1}", "%", "36-50", "normal"),
                ];

            case "Liver Function Test":
                var alt = faker.Random.Int(7, 70);
                var ast = faker.Random.Int(10, 50);
                return
                [
                    new("ALT", $"{alt}", "U/L", "7-56", alt > 56 ? "high" : "normal"),
                    new("AST", $"{ast}", "U/L", "10-40", ast > 40 ? "high" : "normal"),
                    new("ALP", $"{faker.Random.Int(44, 147)}", "U/L", "44-147", "normal"),
                    new("Bilirubin", $"{faker.Random.Int(3, 21)}", "µmol/L", "3-21", "normal"),
                    new("Albumin", $"{faker.Random.Double(35, 50):F1}", "g/L", "35-50", "normal"),
                ];

            case "Lipid Panel":
                var tc = faker.Random.Double(3.5, 6.5);
                var ldl = faker.Random.Double(1.5, 4.5);
                var hdl = faker.Random.Double(0.9, 2.0);
                var tg = faker.Random.Double(0.5, 2.5);
                return
                [
                    new(
                        "Total Cholesterol",
                        $"{tc:F1}",
                        "mmol/L",
                        "<5.2",
                        tc > 5.2 ? "high" : "normal"
                    ),
                    new("LDL", $"{ldl:F1}", "mmol/L", "<3.0", ldl > 3.0 ? "high" : "normal"),
                    new("HDL", $"{hdl:F1}", "mmol/L", ">1.0", hdl < 1.0 ? "low" : "normal"),
                    new(
                        "Triglycerides",
                        $"{tg:F1}",
                        "mmol/L",
                        "<1.7",
                        tg > 1.7 ? "high" : "normal"
                    ),
                ];

            case "HbA1c":
                var hba1c = faker.Random.Double(4.5, 9.0);
                var eag = faker.Random.Int(80, 200);
                return
                [
                    new("HbA1c", $"{hba1c:F1}", "%", "<5.7", hba1c > 6.5 ? "high" : "normal"),
                    new(
                        "Est. Avg Glucose",
                        $"{eag}",
                        "mg/dL",
                        "70-140",
                        eag > 140 ? "high" : "normal"
                    ),
                ];

            case "Renal Function Test":
                return
                [
                    new(
                        "Creatinine",
                        $"{faker.Random.Double(60, 110):F0}",
                        "µmol/L",
                        "60-110",
                        "normal"
                    ),
                    new(
                        "Urea",
                        $"{faker.Random.Double(2.5, 8.0):F1}",
                        "mmol/L",
                        "2.5-8.0",
                        "normal"
                    ),
                    new("eGFR", $"{faker.Random.Int(60, 120)}", "mL/min", ">60", "normal"),
                    new(
                        "Potassium",
                        $"{faker.Random.Double(3.5, 5.0):F1}",
                        "mmol/L",
                        "3.5-5.0",
                        "normal"
                    ),
                    new("Sodium", $"{faker.Random.Int(136, 146)}", "mmol/L", "136-146", "normal"),
                ];

            default:
                return [new("Result", faker.Lorem.Word(), "—", "See reference", "normal")];
        }
    }
}
