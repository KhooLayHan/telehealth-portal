import { createFileRoute } from "@tanstack/react-router";
import { DoctorSchedulesPage } from "@/features/schedules/DoctorSchedulesPage";

export const Route = createFileRoute("/_protected/schedules")({
  component: DoctorSchedulesPage,
});
