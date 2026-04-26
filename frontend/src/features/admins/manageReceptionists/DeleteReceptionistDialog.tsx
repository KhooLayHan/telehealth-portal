import { useQueryClient } from "@tanstack/react-query";
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
import { Separator } from "@/components/ui/separator";

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
          <DialogTitle className="text-xl font-semibold">Remove Receptionist</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Are you sure you want to remove{" "}
            <span className="font-medium text-foreground">
              {receptionist.firstName} {receptionist.lastName}
            </span>
            ? Their account will be disabled and they will no longer be able to log in. This action
            cannot be undone from the portal.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <DialogFooter className="px-6 py-4">
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
