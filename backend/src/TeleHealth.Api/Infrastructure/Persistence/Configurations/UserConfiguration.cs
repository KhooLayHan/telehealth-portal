using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Npgsql.EntityFrameworkCore.PostgreSQL.ValueGeneration;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        var genderColumn = builder.Metadata.FindProperty(nameof(User.Gender))!.GetColumnName();
        var dobColumn = builder.Metadata.FindProperty(nameof(User.DateOfBirth))!.GetColumnName();
        var deletedAtColumn = builder.Metadata.FindProperty(nameof(User.DeletedAt))!.GetColumnName();

        builder.ToTable(
            "users",
            t =>
            {
                t.HasCheckConstraint("chk_users_gender", $"{genderColumn} in ('M', 'F', 'O', 'N')");
                t.HasCheckConstraint("chk_users_dob_not_future", $"{dobColumn} <= current_date");
            }
        );

        builder.HasKey(u => u.Id);

        builder.Property(u => u.PublicId).HasValueGenerator<NpgsqlSequentialGuidValueGenerator>();

        builder.Property(u => u.Slug).HasMaxLength(100).IsRequired();
        builder.HasIndex(u => u.Slug).IsUnique();

        builder.Property(u => u.Username).HasMaxLength(50).IsRequired();
        builder.HasIndex(u => u.Username).IsUnique().HasFilter($"{deletedAtColumn} is null")
            .HasDatabaseName("uq_users_username_active");

        builder.Property(u => u.Email).HasMaxLength(255).IsRequired();
        builder.HasIndex(u => u.Email).IsUnique().HasFilter($"{deletedAtColumn} is null")
            .HasDatabaseName("uq_users_email_active");

        builder.Property(u => u.PasswordHash).HasMaxLength(255).IsRequired();

        builder.Property(u => u.FirstName).HasMaxLength(100).IsRequired();

        builder.Property(u => u.LastName).HasMaxLength(100).IsRequired();

        builder.Property(u => u.AvatarUrl).HasColumnType("text");

        builder.Property(u => u.Gender).IsRequired();

        builder.Property(u => u.DateOfBirth);

        builder.Property(u => u.Phone).HasMaxLength(20);

        builder.Property(u => u.IcNumber).HasMaxLength(12);
        builder.HasIndex(u => u.IcNumber).IsUnique().HasFilter($"{deletedAtColumn} is null")
            .HasDatabaseName("uq_users_ic_active");

        builder.ComplexProperty(
            u => u.Address,
            c =>
            {
                c.Property(a => a.Street).HasMaxLength(100).IsRequired();
                c.Property(a => a.City).HasMaxLength(50).IsRequired();
                c.Property(a => a.State).HasMaxLength(50).IsRequired();
                c.Property(a => a.PostalCode).HasMaxLength(50).IsRequired();
                c.Property(a => a.Country).HasMaxLength(50).IsRequired();
                c.ToJson();
            }
        );

        builder.Property(u => u.CreatedAt).IsRequired().HasDefaultValueSql("now()");

        builder.Property(u => u.UpdatedAt);

        builder.Property(u => u.DeletedAt);
        builder.HasQueryFilter(u => u.DeletedAt == null);

        builder
            .HasMany(u => u.Roles)
            .WithMany(r => r.Users)
            .UsingEntity<UserRole>(j =>
                j.ToTable("user_roles").Property(ur => ur.CreatedAt).HasDefaultValueSql("now()")
            );
    }
}
