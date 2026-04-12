import { motion } from "framer-motion";
import { useGetAllAppointments } from "@/api/generated/appointments/appointments";
import { Separator } from "@/components/ui/separator";
import { columns } from "../components/Columns";
import { DataTable } from "../components/DataTable";

const ACCENT = "#0d9488";

export function ReceptionistApptPage() {
  const { data, isLoading, isError } = useGetAllAppointments();

  const appointments = data?.status === 200 ? data.data.items : [];
  const totalCount = data?.status === 200 ? data.data.totalCount : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        <div className="absolute top-0 inset-x-0 h-0.75" style={{ background: ACCENT }} />

        {/* Card header */}
        <div className="flex items-end justify-between px-6 pt-6 pb-4">
          <div>
            <p
              className="text-[10px] tracking-[0.22em] uppercase font-semibold mb-1"
              style={{ color: ACCENT }}
            >
              Appointments
            </p>
            <h1 className="text-2xl font-semibold tracking-tight leading-none">All Appointments</h1>
          </div>

          {!isLoading && !isError && (
            <span className="font-mono text-xs text-muted-foreground border border-border rounded-full px-3 py-1">
              {totalCount} total
            </span>
          )}
        </div>

        <Separator />

        {/* Card content */}
        <div className="px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm text-muted-foreground tracking-wide">Loading appointments…</p>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm text-destructive">Failed to load appointments.</p>
            </div>
          ) : (
            <DataTable columns={columns} data={appointments ?? []} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
