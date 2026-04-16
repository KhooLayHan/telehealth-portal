import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { SymptomItem } from "../../schema";

type SymptomCardProps = {
  symptom: SymptomItem;
  index: number;
  onRemove: () => void;
  children: React.ReactNode;
};

export function SymptomCard({ symptom, index, onRemove, children }: SymptomCardProps) {
  return (
    <div className="flex items-start gap-2 bg-muted/30 p-3 rounded-lg border border-border">
      <div className="grid flex-1 gap-3 sm:grid-cols-3">{children}</div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Remove symptom ${symptom.name || index + 1}`}
        className="text-destructive hover:bg-destructive/10 justify-center justify-items-center"
        onClick={onRemove}
      >
        <Trash2 className="size-4 place-items-center" />
      </Button>
    </div>
  );
}

type AddSymptomButtonProps = {
  onClick: () => void;
};

export function AddSymptomButton({ onClick }: AddSymptomButtonProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between">
        <div>
          <Label>Symptoms (Optional)</Label>
          <p className="text-xs text-muted-foreground pt-1.5">
            Add specific symptoms you are experiencing.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onClick}>
          <Plus className="mr-1 size-3" />
          Add Symptom
        </Button>
      </div>
    </div>
  );
}
