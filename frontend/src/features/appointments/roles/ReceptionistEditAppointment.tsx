import { useParams } from "@tanstack/react-router";
import { motion, type Variants } from "framer-motion";
import { useGetAppointmentByIdForReceptionist } from "@/api/generated/appointments/appointments";
import type { ReceptionistAppointmentDetailDto } from "@/api/model/ReceptionistAppointmentDetailDto";
import { AppointmentEditForm } from "./components/AppointmentEditForm";
import { TERMINAL_SLUGS } from "./components/Constants";
import { PatientInfoCard } from "./components/PatientInfoCard";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

function EditFormContent({ appointment }: { appointment: ReceptionistAppointmentDetailDto }) {
  const isTerminal = TERMINAL_SLUGS.includes(appointment.statusSlug ?? "");

  return (
    <motion.div
      className="grid grid-cols-2 gap-5 max-w-4xl"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={cardVariant} className="h-full">
        <PatientInfoCard appointment={appointment} isTerminal={isTerminal} />
      </motion.div>

      <motion.div variants={cardVariant} className="h-full">
        <AppointmentEditForm appointment={appointment} isTerminal={isTerminal} />
      </motion.div>
    </motion.div>
  );
}

export function ReceptionistEditApptPage() {
  const { id } = useParams({ from: "/_protected/appointments/edit/$id" });
  const { data, isLoading, isError } = useGetAppointmentByIdForReceptionist(id);

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading...</p>;
  if (isError || !data || data.status !== 200) {
    return <p className="text-destructive text-sm">Failed to load appointment.</p>;
  }

  return <EditFormContent appointment={data.data} />;
}
