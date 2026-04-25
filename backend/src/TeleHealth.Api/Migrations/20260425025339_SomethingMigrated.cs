using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeleHealth.Api.Migrations
{
    /// <inheritdoc />
    public partial class SomethingMigrated : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "bus_name",
                table: "outbox_state",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_outbox_state_bus_name_created",
                table: "outbox_state",
                columns: new[] { "bus_name", "created" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_outbox_state_bus_name_created",
                table: "outbox_state");

            migrationBuilder.DropColumn(
                name: "bus_name",
                table: "outbox_state");
        }
    }
}
