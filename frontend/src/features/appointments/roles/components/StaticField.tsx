import type * as React from "react";

export function StaticField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60">
        {label}
      </span>
      <span className="text-sm font-medium leading-snug">{value ?? "—"}</span>
    </div>
  );
}
