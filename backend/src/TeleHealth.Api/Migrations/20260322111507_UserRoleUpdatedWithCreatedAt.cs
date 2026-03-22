using Microsoft.EntityFrameworkCore.Migrations;
using NodaTime;

#nullable disable

namespace TeleHealth.Api.Migrations
{
    /// <inheritdoc />
    public partial class UserRoleUpdatedWithCreatedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_user_roles_roles_roles_id",
                table: "user_roles");

            migrationBuilder.DropPrimaryKey(
                name: "pk_user_roles",
                table: "user_roles");

            migrationBuilder.RenameColumn(
                name: "roles_id",
                table: "user_roles",
                newName: "user_id");

            migrationBuilder.AlterColumn<string>(
                name: "avatar_url",
                table: "users",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "role_id",
                table: "user_roles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Instant>(
                name: "created_at",
                table: "user_roles",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()");

            migrationBuilder.AddPrimaryKey(
                name: "pk_user_roles",
                table: "user_roles",
                columns: new[] { "role_id", "users_id" });

            migrationBuilder.AddForeignKey(
                name: "fk_user_roles_roles_role_id",
                table: "user_roles",
                column: "role_id",
                principalTable: "roles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_user_roles_roles_role_id",
                table: "user_roles");

            migrationBuilder.DropPrimaryKey(
                name: "pk_user_roles",
                table: "user_roles");

            migrationBuilder.DropColumn(
                name: "role_id",
                table: "user_roles");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "user_roles");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "user_roles",
                newName: "roles_id");

            migrationBuilder.AlterColumn<string>(
                name: "avatar_url",
                table: "users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "pk_user_roles",
                table: "user_roles",
                columns: new[] { "roles_id", "users_id" });

            migrationBuilder.AddForeignKey(
                name: "fk_user_roles_roles_roles_id",
                table: "user_roles",
                column: "roles_id",
                principalTable: "roles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
