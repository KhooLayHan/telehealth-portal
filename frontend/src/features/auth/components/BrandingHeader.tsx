import { Heart } from "lucide-react";
import { useSystemName } from "@/features/system-settings/useSystemName";

export function BrandingHeader() {
  const { systemName } = useSystemName();

  return (
    <div className="flex items-center justify-center gap-2 lg:hidden">
      <Heart className="size-6 text-primary" />
      <span className="truncate font-bold text-xl">{systemName}</span>
    </div>
  );
}
