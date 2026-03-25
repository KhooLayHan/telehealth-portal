using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeleHealth.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditLogsTriggers : Migration
    {
        private readonly string[] _auditTables =
        [
            "users",
            "appointments",
            "consultations",
            "prescriptions",
            "lab_reports",
        ];

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
                    CREATE OR REPLACE FUNCTION fn_audit_log()
                    RETURNS TRIGGER AS $$
                    DECLARE
                        v_old_values   JSONB;
                        v_new_values   JSONB;
                        v_changed_cols JSONB[];
                        v_user_id      BIGINT;
                        v_is_system    BOOLEAN;

                        v_sanitize_keys TEXT[] := ARRAY[
                            'password_hash', 'password', 'hashed_password', 
                            'national_id', 'ssn', 'medical_notes', 
                            'diagnosis_details', 'prescription_data', 
                            'lab_results', 'file_data', 'attachments'
                        ];
                    BEGIN
                        -- Safely read session variables set by EF Core
                        BEGIN
                            v_user_id   := current_setting('app.current_user_id')::BIGINT;
                            v_is_system := current_setting('app.is_system')::BOOLEAN;
                        EXCEPTION WHEN OTHERS THEN
                            v_user_id   := NULL;
                            v_is_system := TRUE;
                        END;

                        IF (TG_OP = 'INSERT') THEN
                            v_old_values   := NULL;
                            v_new_values   := to_jsonb(NEW) - v_sanitize_keys;;
                            v_changed_cols := NULL;

                        ELSIF (TG_OP = 'UPDATE') THEN
                            v_old_values := to_jsonb(OLD) - v_sanitize_keys;;
                            v_new_values := to_jsonb(NEW) - v_sanitize_keys;;
                            -- Collect only changed columns
                            SELECT array_agg(to_jsonb(key))
                            INTO   v_changed_cols
                            FROM   jsonb_each(v_old_values) AS o(key, value)
                            WHERE  v_old_values->key IS DISTINCT FROM v_new_values->key;

                        ELSIF (TG_OP = 'DELETE') THEN
                            v_old_values   := to_jsonb(OLD) - v_sanitize_keys;;
                            v_new_values   := NULL;
                            v_changed_cols := NULL;
                        END IF;

                        INSERT INTO audit_logs (
                            table_name,
                            record_id,
                            action,
                            old_values,
                            new_values,
                            changed_columns,
                            performed_by_user_id,
                            performed_by_system
                        ) VALUES (
                            TG_TABLE_NAME,
                            CASE
                                WHEN TG_OP = 'DELETE' THEN OLD.id
                                ELSE NEW.id
                            END,
                            TG_OP,
                            v_old_values,
                            v_new_values,
                            v_changed_cols,
                            v_user_id,
                            v_is_system
                        );

                        RETURN COALESCE(NEW, OLD);
                    END;
                    $$ LANGUAGE plpgsql;
                "
            );
            foreach (var table in _auditTables)
            {
                migrationBuilder.Sql(
                    $@"
                        CREATE TRIGGER trg_{table}_audit
                        AFTER INSERT OR UPDATE OR DELETE ON {table}
                        FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
                    "
                );
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach (var table in _auditTables)
            {
                migrationBuilder.Sql($"DROP TRIGGER IF EXISTS trg_{table}_audit ON {table};");
            }

            migrationBuilder.Sql("DROP FUNCTION IF EXISTS fn_audit_log();");
        }
    }
}
