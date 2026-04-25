import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useGetAll } from "@/api/generated/doctors/doctors";
import type { DoctorListDto } from "@/api/model/DoctorListDto";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DoctorCard } from "./manageDoctors/components/DoctorCard";

export function AdminDoctorsPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { data, isLoading } = useGetAll();
  const allDoctors = data?.status === 200 ? data.data : [];
  const totalCount = allDoctors.length;

  return (
    <>
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Doctor Directory</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mt-3 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Doctor Directory</h1>
          <Button
            className="shrink-0 gap-1.5 bg-black text-white hover:bg-black/85"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="size-4" />
            Add New Doctor
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage {isLoading ? "…" : totalCount} registered medical professionals across 12
          departments.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {isLoading ? (
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
            Loading doctors…
          </p>
        ) : allDoctors.length === 0 ? (
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
            No doctors found.
          </p>
        ) : (
          allDoctors.map((doctor: DoctorListDto) => (
            <DoctorCard
              key={String(doctor.doctorPublicId)}
              doctor={{
                publicId: String(doctor.doctorPublicId),
                name: `${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim(),
                specialty: doctor.specialization ?? "",
                department: doctor.departmentName ?? "",
                email: doctor.email ?? "",
                phone: doctor.phoneNumber ?? "—",
                joinedDate: String(doctor.createdAt),
                feePerSessionMyr: Number(doctor.consultationFee ?? 0),
                isOnDuty: false,
              }}
              onViewDetails={() => {}}
              onRemove={() => {}}
            />
          ))
        )}
      </motion.div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add New Doctor</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Fill in the details below to register a new doctor account.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
