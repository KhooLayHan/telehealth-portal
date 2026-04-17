using System;
using System.Collections.Generic;
using System.Text.Json;

using Microsoft.EntityFrameworkCore.Migrations;

using NodaTime;

using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TeleHealth.Api.Migrations
{
    /// <inheritdoc />
    public partial class SystemAuditsTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "audit_logs",
                columns: table => new
                {
                    id = table
                        .Column<long>(type: "bigint", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    public_id = table.Column<Guid>(type: "uuid", nullable: false),
                    table_name = table.Column<string>(
                        type: "character varying(100)",
                        maxLength: 100,
                        nullable: false
                    ),
                    record_id = table.Column<long>(type: "bigint", nullable: false),
                    action = table.Column<string>(
                        type: "character varying(20)",
                        maxLength: 20,
                        nullable: false
                    ),
                    old_values = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    new_values = table.Column<JsonDocument>(type: "jsonb", nullable: true),
                    changed_columns = table.Column<List<JsonDocument>>(
                        type: "jsonb[]",
                        nullable: true
                    ),
                    performed_by_user_id = table.Column<long>(type: "bigint", nullable: true),
                    performed_by_system = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<Instant>(
                        type: "timestamp with time zone",
                        nullable: false,
                        defaultValueSql: "now()"
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_audit_logs", x => x.id);
                    table.CheckConstraint(
                        "chk_audit_action",
                        "action in ('INSERT', 'UPDATE', 'DELETE')"
                    );
                    table.CheckConstraint(
                        "chk_audit_logs_actor",
                        "performed_by_system or performed_by_user_id is not null"
                    );
                    table.ForeignKey(
                        name: "fk_audit_logs_users_performed_by_user_id",
                        column: x => x.performed_by_user_id,
                        principalTable: "users",
                        principalColumn: "id"
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    id = table
                        .Column<long>(type: "bigint", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    public_id = table.Column<Guid>(type: "uuid", nullable: false),
                    recipient_user_id = table.Column<long>(type: "bigint", nullable: false),
                    type = table.Column<string>(
                        type: "character varying(50)",
                        maxLength: 50,
                        nullable: false
                    ),
                    channel = table.Column<string>(
                        type: "character varying(20)",
                        maxLength: 20,
                        nullable: false
                    ),
                    subject = table.Column<string>(
                        type: "character varying(255)",
                        maxLength: 255,
                        nullable: true
                    ),
                    body = table.Column<string>(type: "text", nullable: false),
                    related_entity_type = table.Column<string>(
                        type: "character varying(50)",
                        maxLength: 50,
                        nullable: true
                    ),
                    related_entity_id = table.Column<long>(type: "bigint", nullable: true),
                    sns_message_id = table.Column<string>(
                        type: "character varying(100)",
                        maxLength: 100,
                        nullable: true
                    ),
                    status = table.Column<string>(
                        type: "character varying(20)",
                        maxLength: 20,
                        nullable: false
                    ),
                    send_at = table.Column<Instant>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    error_message = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<Instant>(
                        type: "timestamp with time zone",
                        nullable: false,
                        defaultValueSql: "now()"
                    ),
                    updated_at = table.Column<Instant>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notifications", x => x.id);
                    table.CheckConstraint(
                        "chk_notification_status",
                        "status in ('queued', 'sent', 'failed')"
                    );
                    table.ForeignKey(
                        name: "fk_notifications_users_recipient_user_id",
                        column: x => x.recipient_user_id,
                        principalTable: "users",
                        principalColumn: "id"
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_performed_by_user_id",
                table: "audit_logs",
                column: "performed_by_user_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_notifications_recipient_user_id",
                table: "notifications",
                column: "recipient_user_id"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "audit_logs");

            migrationBuilder.DropTable(name: "notifications");
        }
    }
}