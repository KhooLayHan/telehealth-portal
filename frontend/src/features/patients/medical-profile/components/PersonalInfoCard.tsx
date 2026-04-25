// import { Lock, User } from "lucide-react";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import type { PersonalInfoCardProps } from "../types";

// export function PersonalInfoCard({ profile }: PersonalInfoCardProps) {
//   const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();

//   return (
//     <Card className="shadow-sm">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2 text-lg">
//           <User className="size-5 text-primary" /> Personal Information
//         </CardTitle>
//         <CardDescription>Basic details managed by your account settings.</CardDescription>
//       </CardHeader>
//       <CardContent className="grid gap-4 sm:grid-cols-2">
//         <div className="space-y-1">
//           <Label htmlFor="firstName" className="text-muted-foreground">
//             First Name
//           </Label>
//           <Input id="firstName" value={profile.firstName} disabled className="bg-muted/50" />
//         </div>
//         <div className="space-y-1">
//           <Label htmlFor="lastName" className="text-muted-foreground">
//             Last Name
//           </Label>
//           <Input id="lastName" value={profile.lastName} disabled className="bg-muted/50" />
//         </div>
//         <div className="space-y-1 sm:col-span-2">
//           <Label htmlFor="email" className="text-muted-foreground">
//             Email Address
//           </Label>
//           <Input id="email" value={profile.email} disabled className="bg-muted/50" />
//         </div>
//         <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
//           <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
//             {initials}
//           </div>

//           <div className="min-w-0 flex-1">
//             <p className="text-sm font-semibold">
//               {profile.firstName} {profile.lastName}
//             </p>
//             <p className="text-muted-foreground text-xs">{profile.email}</p>
//           </div>

//           <div className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
//             <Lock className="size-2.5" />
//             Read-only
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

import { Lock, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PersonalInfoCardProps } from "../types";

export function PersonalInfoCard({ profile }: PersonalInfoCardProps) {
  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="size-5 text-primary" /> Personal Information
        </CardTitle>
        <CardDescription>Basic details managed by your account settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-muted-foreground text-xs">{profile.email}</p>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Lock className="size-2.5" />
            Read-only
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
