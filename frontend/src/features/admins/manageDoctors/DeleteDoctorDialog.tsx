import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getGetAllQueryKey, useDeleteDoctorById } from "@/api/generated/doctors/doctors";
import type { DoctorListDto } from "@/api/model/DoctorListDto";
import { ApiError } from "@/api/ofetch-mutator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Describes the selected doctor and open state for the delete confirmation dialog.
interface DeleteDoctorDialogProps {
  doctor: DoctorListDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Displays a confirmation dialog and deletes the selected doctor when confirmed.
export function DeleteDoctorDialog({ doctor, open, onOpenChange }: DeleteDoctorDialogProps) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useDeleteDoctorById();

  if (!doctor) return null;

  const handleConfirm = async () => {
    try {
      await mutateAsync({ id: String(doctor.doctorPublicId) });
      toast.success(`Dr. ${doctor.firstName ?? ""} ${doctor.lastName ?? ""} has been removed.`);
      await queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.data?.title ?? "Failed to delete doctor.");
      } else {
        toast.error("Failed to delete doctor.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-destructive" />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-xl font-semibold">Remove Doctor</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove{" "}
                <span className="font-medium text-foreground">
                  Dr. {doctor.firstName ?? ""} {doctor.lastName ?? ""}
                </span>
                ? This will deactivate the doctor account and remove it from active doctor lists.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={isPending} onClick={handleConfirm}>
            {isPending ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
