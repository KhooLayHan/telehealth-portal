import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAdminGetAllLabTechsQueryKey,
  useAdminDeactivateLabTech,
} from "@/api/generated/admins/admins";
import type { AdminLabTechDto } from "@/api/model/AdminLabTechDto";
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

// Describes the open state controls and selected lab technician for the delete dialog.
interface DeleteLabTechDialogProps {
  labTech: AdminLabTechDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Confirmation dialog before removing a lab technician account.
export function DeleteLabTechDialog({ labTech, open, onOpenChange }: DeleteLabTechDialogProps) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useAdminDeactivateLabTech({
    mutation: {
      onSuccess: () => {
        toast.success("Lab technician removed successfully");
        queryClient.invalidateQueries({ queryKey: getAdminGetAllLabTechsQueryKey() });
        onOpenChange(false);
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          toast.error(error.data.title ?? "Failed to remove lab technician");
          return;
        }

        toast.error("Failed to remove lab technician");
      },
    },
  });

  if (!labTech) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-destructive" />
        <DialogHeader className="px-6 pb-4 pt-7">
          <DialogTitle className="text-xl font-semibold">Remove Lab Technician</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Are you sure you want to remove{" "}
            <span className="font-medium text-foreground">
              {labTech.firstName} {labTech.lastName}
            </span>
            ? Their account will be disabled and they will no longer be able to access laboratory
            workflows. This action cannot be undone from the portal.
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
              if (labTech.publicId) {
                mutate({ id: labTech.publicId.toString() });
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
