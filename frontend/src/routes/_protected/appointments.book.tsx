import { createFileRoute, redirect } from "@tanstack/react-router";
import { BookAppointmentForm } from "@/features/patients/book/BookAppointmentForm";
import { useAuthStore } from "@/store/useAuthStore";

export const Route = createFileRoute("/_protected/appointments/book")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    const role = user?.role?.toLowerCase();

    if (role !== "patient") {
      redirect({ to: "/" });
    }
  },
  component: BookAppointmentRouteComponent,
});

function BookAppointmentRouteComponent() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-bold text-2xl">Book Appointment</h1>
      <BookAppointmentForm />
    </div>
  );
}
