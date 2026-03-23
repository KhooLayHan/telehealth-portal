using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL.ValueGeneration;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        var deletedAtColumn = builder
            .Metadata.FindProperty(nameof(Appointment.DeletedAt))!
            .GetColumnName();

        builder.ToTable("appointments");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.PublicId).HasValueGenerator<NpgsqlSequentialGuidValueGenerator>();

        builder.Property(a => a.Slug).HasMaxLength(100).IsRequired();
        builder.HasIndex(a => a.Slug).IsUnique();

        builder.Property(a => a.PatientId).IsRequired();

        builder.Property(a => a.DoctorId).IsRequired();

        builder.Property(a => a.ScheduleId).IsRequired();
        builder
            .HasIndex(a => a.ScheduleId)
            .IsUnique()
            .HasFilter($"{deletedAtColumn} is null")
            .HasDatabaseName("uq_appointments_schedule_active");

        builder.Property(a => a.StatusId).IsRequired();

        builder.Property(a => a.CreatedByUserId).IsRequired();

        builder.Property(a => a.VisitReason).HasMaxLength(500).IsRequired();

        builder.ComplexCollection(
            a => a.Symptoms,
            c =>
            {
                c.Property(s => s.Name).IsRequired();
                c.Property(s => s.Severity).IsRequired();
                c.Property(s => s.Duration).IsRequired();
                c.ToJson();
            }
        );

        builder.Property(a => a.CheckInDateTime);

        builder.Property(a => a.CancellationReason).HasMaxLength(500);

        builder.Property(a => a.CreatedAt).IsRequired().HasDefaultValueSql("now()");

        builder.Property(a => a.UpdatedAt);

        builder.Property(a => a.DeletedAt);
        builder.HasQueryFilter("SoftDeletionFilter", a => a.DeletedAt == null);

        builder
            .HasOne(a => a.Patient)
            .WithMany(p => p.Appointments)
            .HasForeignKey(a => a.PatientId)
            .IsRequired();
        
        builder
            .HasOne(a => a.Doctor)
            .WithMany(d => d.Appointments)
            .HasForeignKey(a => a.DoctorId)
            .IsRequired();
        
        builder
            .HasOne(a => a.DoctorSchedule)
            .WithOne(d => d.Appointment)
            .HasForeignKey<Appointment>(a => a.ScheduleId)
            .IsRequired().OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(a => a.AppointmentStatus)
            .WithMany(s => s.Appointments)
            .HasForeignKey(a => a.StatusId)
            .IsRequired();
        
        builder
            .HasOne(a => a.User)
            .WithMany(u => u.Appointments)
            .HasForeignKey(a => a.CreatedByUserId)
            .IsRequired();
    }
}
