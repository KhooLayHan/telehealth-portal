import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  getAdminGetAllDepartmentsQueryKey,
  useAdminDeleteDepartment,
} from "@/api/generated/admins/admins";
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
import type { DepartmentTableRow } from "./UseDepartmentsTable";

// Props for controlling the department soft-delete confirmation dialog.
interface DeleteDepartmentDialogProps {
  department: DepartmentTableRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Confirms and submits a backend soft delete for the selected department.
export function DeleteDepartmentDialog({
  department,
  open,
  onOpenChange,
}: DeleteDepartmentDialogProps) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useAdminDeleteDepartment();

  if (!department) {
    return null;
  }

  const handleConfirmDelete = async () => {
    try {
      await mutateAsync({ slug: department.id });
      toast.success("Department deleted successfully");
      await queryClient.invalidateQueries({ queryKey: getAdminGetAllDepartmentsQueryKey() });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.data.title ?? "Failed to delete department");
        return;
      }

      toast.error("Failed to delete department");
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
              <DialogTitle className="text-xl font-semibold">Remove Department</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove{" "}
                <span className="font-medium text-foreground">{department.name}</span>? This will
                deactivate the department and remove it from active department lists.
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
