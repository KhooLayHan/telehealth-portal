using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL.ValueGeneration;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        var actionColumn = builder.Metadata.FindProperty(nameof(AuditLog.Action))!.GetColumnName();

        builder.ToTable(
            "audit_logs",
            t =>
                t.HasCheckConstraint(
                    "chk_audit_action",
                    $"{actionColumn} in ('INSERT', 'UPDATE', 'DELETE')"
                )
        );

        builder.HasKey(a => a.Id);

        builder.Property(a => a.PublicId).HasValueGenerator<NpgsqlSequentialGuidValueGenerator>();

        builder.Property(a => a.TableName).HasMaxLength(100).IsRequired();

        builder.Property(a => a.RecordId).IsRequired();

        builder.Property(a => a.Action).HasMaxLength(20).IsRequired();

        builder.ComplexProperty(a => a.OldValues, c => c.ToJson());

        builder.ComplexProperty(a => a.NewValues, c => c.ToJson());

        builder.ComplexProperty(a => a.ChangedColumns, c => c.ToJson());

        builder.Property(a => a.PerformedByUserId);

        builder.Property(a => a.PerformedBySystem).HasDefaultValueSql("false");

        builder.Property(a => a.CreatedAt).IsRequired().HasDefaultValueSql("now()");

        builder
            .HasOne(a => a.User)
            .WithOne(u => u.AuditLog)
            .HasForeignKey<AuditLog>(a => a.PerformedByUserId)
            .IsRequired(false);
    }
}
