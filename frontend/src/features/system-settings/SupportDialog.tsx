import { Copy, LifeBuoy, Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SUPPORT_EMAIL = "support@telehealth.com";

// Props for controlling the support contact dialog.
interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Shows the support contact email without connecting to any backend flow.
export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setHasCopied(false);
    }

    onOpenChange(nextOpen);
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setHasCopied(true);
    } catch {
      setHasCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LifeBuoy className="size-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-xl font-semibold">Contact Support</DialogTitle>
              <DialogDescription>
                Need help with TeleHealth Portal? Please contact our support team by email.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mx-6 mb-6 flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
            <Mail className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm">Support email</p>
            <p className="break-all text-muted-foreground text-sm">{SUPPORT_EMAIL}</p>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
          <Button type="button" onClick={handleCopyEmail}>
            <Copy className="size-4" />
            {hasCopied ? "Copied" : "Copy Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
