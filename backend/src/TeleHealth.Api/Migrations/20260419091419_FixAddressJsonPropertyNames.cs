using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeleHealth.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixAddressJsonPropertyNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // No schema change — only updates EF Core model metadata to map Address JSON
            // sub-property names to their snake_case equivalents in the JSONB column.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No schema change to revert.
        }
    }
}
