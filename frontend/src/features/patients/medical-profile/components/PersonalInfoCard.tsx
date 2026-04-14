import { User } from "lucide-react";
import type { PatientProfileDto } from "@/api/model/PatientProfileDto";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PersonalInfoCardProps = {
  profile: PatientProfileDto;
};

export function PersonalInfoCard({ profile }: PersonalInfoCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="size-5 text-primary" /> Personal Information
        </CardTitle>
        <CardDescription>Basic details managed by your account settings.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="firstName" className="text-muted-foreground">
            First Name
          </Label>
          <Input id="firstName" value={profile.firstName} disabled className="bg-muted/50" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lastName" className="text-muted-foreground">
            Last Name
          </Label>
          <Input id="lastName" value={profile.lastName} disabled className="bg-muted/50" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="email" className="text-muted-foreground">
            Email Address
          </Label>
          <Input id="email" value={profile.email} disabled className="bg-muted/50" />
        </div>
      </CardContent>
    </Card>
  );
}
