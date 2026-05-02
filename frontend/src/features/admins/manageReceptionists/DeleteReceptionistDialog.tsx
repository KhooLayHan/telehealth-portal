import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  getAdminGetAllReceptionistsQueryKey,
  useAdminDeactivateReceptionist,
} from "@/api/generated/admins/admins";
import type { AdminReceptionistDto } from "@/api/model/AdminReceptionistDto";
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

// Describes the open state controls and selected receptionist for the delete dialog
interface DeleteReceptionistDialogProps {
  receptionist: AdminReceptionistDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Confirmation dialog before soft-deleting a receptionist account
export function DeleteReceptionistDialog({
  receptionist,
  open,
  onOpenChange,
}: DeleteReceptionistDialogProps) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useAdminDeactivateReceptionist({
    mutation: {
      onSuccess: () => {
        toast.success("Receptionist removed successfully");
        queryClient.invalidateQueries({ queryKey: getAdminGetAllReceptionistsQueryKey() });
        onOpenChange(false);
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          toast.error(error.data.title ?? "Failed to remove receptionist");
        }
      },
    },
  });

  if (!receptionist) return null;

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
              <DialogTitle className="text-xl font-semibold">Remove Receptionist</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove{" "}
                <span className="font-medium text-foreground">
                  {receptionist.firstName} {receptionist.lastName}
                </span>
                ? This will deactivate the receptionist account and remove it from active
                receptionist lists.
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
            onClick={() => {
              if (receptionist.publicId) {
                mutate({ id: receptionist.publicId.toString() });
              }
            }}
          >
            {isPending ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
