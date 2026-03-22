using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL.ValueGeneration;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable(
            "Users",
            t =>
            {
                t.HasCheckConstraint(
                    "CHK_Users_Gender",
                    $"{nameof(User.Gender)} IN ('M', 'F', 'O', 'N')"
                );
                t.HasCheckConstraint(
                    "CHK_Users_Dob_NotFuture",
                    $"{nameof(User.DateOfBirth)} <= CURRENT_DATE"
                );
            }
        );

        builder.HasKey(u => u.Id);

        builder.Property(u => u.PublicId).HasValueGenerator<NpgsqlSequentialGuidValueGenerator>();

        builder.Property(r => r.Slug).HasMaxLength(100).IsRequired();
        builder.HasIndex(r => r.Slug).IsUnique();

        builder.Property(r => r.Username).HasMaxLength(50).IsRequired();

        builder.Property(u => u.Email).HasMaxLength(255).IsRequired();

        builder.Property(u => u.PasswordHash).HasMaxLength(255).IsRequired();

        builder.Property(u => u.FirstName).HasMaxLength(100).IsRequired();

        builder.Property(u => u.LastName).HasMaxLength(100).IsRequired();

        builder.Property(u => u.AvatarUrl).HasMaxLength(100);

        builder.Property(u => u.Gender).IsRequired();

        builder.Property(u => u.DateOfBirth);

        builder.Property(u => u.Phone).HasMaxLength(20);

        builder.Property(u => u.IcNumber).HasMaxLength(12);

        builder.ComplexProperty(
            u => u.Address,
            d =>
            {
                d.Property(a => a.Street).HasMaxLength(100).IsRequired();
                d.Property(a => a.City).HasMaxLength(50).IsRequired();
                d.Property(a => a.State).HasMaxLength(50).IsRequired();
                d.Property(a => a.PostalCode).HasMaxLength(50).IsRequired();
                d.Property(a => a.Country).HasMaxLength(50).IsRequired();
                d.ToJson();
            }
        );

        builder.Property(u => u.CreatedAt).IsRequired().HasDefaultValueSql("NOW()");

        builder.Property(u => u.UpdatedAt);

        builder.Property(u => u.DeletedAt);
        builder.HasQueryFilter(u => u.DeletedAt == null);

        builder
            .HasMany(u => u.Roles)
            .WithMany(r => r.Users)
            .UsingEntity((j => j.ToTable("user_roles")));
    }
}
