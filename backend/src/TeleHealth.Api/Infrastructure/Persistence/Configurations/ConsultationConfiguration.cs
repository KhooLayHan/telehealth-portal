using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL.ValueGeneration;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public class ConsultationConfiguration : IEntityTypeConfiguration<Consultation>
{
    public void Configure(EntityTypeBuilder<Consultation> builder)
    {
        var deletedAtColumn = builder
            .Metadata.FindProperty(nameof(Consultation.DeletedAt))!
            .GetColumnName();

        builder.ToTable("consultations");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.PublicId).HasValueGenerator<NpgsqlSequentialGuidValueGenerator>();

        builder.Property(c => c.Slug).HasMaxLength(100).IsRequired();
        builder.HasIndex(c => c.Slug).IsUnique();

        builder.Property(c => c.AppointmentId).IsRequired();
        builder
            .HasIndex(c => c.AppointmentId)
            .IsUnique()
            .HasFilter($"{deletedAtColumn} is null")
            .HasDatabaseName("uq_consultations_appointment_active");

        builder.ComplexProperty(c => c.ConsultationNotes, cb =>
        {
            cb.Property(cn => cn.Subjective).IsRequired();
            cb.Property(cn => cn.Objective).IsRequired();
            cb.Property(cn => cn.Assessment).IsRequired();
            cb.Property(cn => cn.Plan).IsRequired();
            cb.ToJson();
        });

        builder.Property(c => c.FollowUpDate);
        
        builder.Property(c => c.ConsultationDateTime).IsRequired();

        builder.Property(c => c.CreatedAt).IsRequired().HasDefaultValueSql("now()");

        builder.Property(c => c.UpdatedAt);

        builder.Property(c => c.DeletedAt);
        builder.HasQueryFilter("SoftDeletionFilter", c => c.DeletedAt == null);

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
            .HasOne(c => c.Appointment)
            .WithOne(a => a.Consultation)
            .HasForeignKey<Consultation>(c => c.AppointmentId)
            .IsRequired().OnDelete(DeleteBehavior.Restrict);
    }
}
