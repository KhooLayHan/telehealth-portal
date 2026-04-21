import { createFileRoute } from "@tanstack/react-router";
import { LabReportsPage } from "@/features/lab-reports/LabReportsPage";

export const Route = createFileRoute("/_protected/lab-reports/")({
  component: LabReportsPage,
});
