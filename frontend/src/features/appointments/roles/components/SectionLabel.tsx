import type * as React from "react";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] tracking-[0.22em] uppercase font-semibold text-muted-foreground mb-3 select-none">
      {children}
    </p>
  );
}
