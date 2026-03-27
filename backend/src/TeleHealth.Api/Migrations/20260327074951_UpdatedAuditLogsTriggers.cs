using System.Collections.Generic;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeleHealth.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedAuditLogsTriggers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string[]>(
                name: "changed_columns",
                table: "audit_logs",
                type: "text[]",
                nullable: true,
                oldClrType: typeof(List<JsonDocument>),
                oldType: "jsonb[]",
                oldNullable: true);

            migrationBuilder.AddColumn<JsonDocument>(
                name: "metadata",
                table: "audit_logs",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "metadata",
                table: "audit_logs");

            migrationBuilder.AlterColumn<List<JsonDocument>>(
                name: "changed_columns",
                table: "audit_logs",
                type: "jsonb[]",
                nullable: true,
                oldClrType: typeof(string[]),
                oldType: "text[]",
                oldNullable: true);
        }
    }
}
