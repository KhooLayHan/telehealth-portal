namespace TeleHealth.Api.Features.Admins.GetClinicActivity;

// Chart data point for the admin dashboard clinic activity graph.
public sealed record AdminClinicActivityDataPointDto(string Label, int Appointments);
