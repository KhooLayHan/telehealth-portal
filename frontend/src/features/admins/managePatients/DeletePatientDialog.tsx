import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  getGetAllPatientsForClinicStaffQueryKey,
  useSoftDeleteById,
} from "@/api/generated/patients/patients";
import type { ClinicStaffPatientDto } from "@/api/model/ClinicStaffPatientDto";
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

// Describes the selected patient and dialog state for the patient delete confirmation.
interface DeletePatientDialogProps {
  patient: ClinicStaffPatientDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Confirms and submits a backend soft delete for the selected patient record.
export function DeletePatientDialog({ patient, open, onOpenChange }: DeletePatientDialogProps) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useSoftDeleteById();

  if (!patient) {
    return null;
  }

  const handleConfirmDelete = async () => {
    try {
      await mutateAsync({ patientPublicId: patient.patientPublicId });
      toast.success("Patient removed successfully");
      await queryClient.invalidateQueries({
        queryKey: getGetAllPatientsForClinicStaffQueryKey(),
      });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.data.title ?? "Failed to remove patient");
        return;
      }

      toast.error("Failed to remove patient");
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
              <DialogTitle className="text-xl font-semibold">Remove Patient</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove{" "}
                <span className="font-medium text-foreground">{patient.fullName}</span>? This will
                deactivate the patient account and remove it from active patient lists.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirmDelete}
          >
            {isPending ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
