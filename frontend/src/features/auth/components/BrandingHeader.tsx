import { Heart } from "lucide-react";

export function BrandingHeader() {
  return (
    <div className="flex items-center justify-center gap-2 lg:hidden">
      <Heart className="size-6 text-primary" />
      <span className="font-bold text-xl">TeleHealth</span>
    </div>
  );
}
