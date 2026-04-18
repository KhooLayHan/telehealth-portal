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
                table: "user_roles"
            );

            migrationBuilder.DropForeignKey(
                name: "fk_user_roles_users_users_id",
                table: "user_roles"
            );

            migrationBuilder.RenameColumn(
                name: "users_id",
                table: "user_roles",
                newName: "user_id"
            );

            migrationBuilder.RenameColumn(
                name: "roles_id",
                table: "user_roles",
                newName: "role_id"
            );

            migrationBuilder.RenameIndex(
                name: "ix_user_roles_users_id",
                table: "user_roles",
                newName: "ix_user_roles_user_id"
            );

            migrationBuilder.AlterColumn<string>(
                name: "avatar_url",
                table: "users",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true
            );

            migrationBuilder.AddColumn<Instant>(
                name: "created_at",
                table: "user_roles",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()"
            );

            migrationBuilder.AddForeignKey(
                name: "fk_user_roles_roles_role_id",
                table: "user_roles",
                column: "role_id",
                principalTable: "roles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade
            );

            migrationBuilder.AddForeignKey(
                name: "fk_user_roles_users_user_id",
                table: "user_roles",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_user_roles_roles_role_id",
                table: "user_roles"
            );

            migrationBuilder.DropForeignKey(
                name: "fk_user_roles_users_user_id",
                table: "user_roles"
            );

            migrationBuilder.DropColumn(name: "created_at", table: "user_roles");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "user_roles",
                newName: "users_id"
            );

            migrationBuilder.RenameColumn(
                name: "role_id",
                table: "user_roles",
                newName: "roles_id"
            );

            migrationBuilder.RenameIndex(
                name: "ix_user_roles_user_id",
                table: "user_roles",
                newName: "ix_user_roles_users_id"
            );

            migrationBuilder.AlterColumn<string>(
                name: "avatar_url",
                table: "users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true
            );

            migrationBuilder.AddForeignKey(
                name: "fk_user_roles_roles_roles_id",
                table: "user_roles",
                column: "roles_id",
                principalTable: "roles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade
            );

            migrationBuilder.AddForeignKey(
                name: "fk_user_roles_users_users_id",
                table: "user_roles",
                column: "users_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade
            );
        }
    }
}