import { motion } from "framer-motion";
import { CalendarClock, CalendarDays, Eye, Mail, MoreVertical, Pencil, Phone, Trash2, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Shape of a single doctor record used by this card
interface Doctor {
  publicId: string;
  name: string;
  specialty: string;
  department: string;
  email: string;
  phone: string;
  joinedDate: string;
  feePerSessionMyr: number;
  avatarUrl?: string;
  isOnDuty: boolean;
  licenseNo: string;
}

// Props accepted by DoctorCard
interface DoctorCardProps {
  doctor: Doctor;
  onViewDetails: (publicId: string) => void;
  onRemove: (publicId: string) => void;
  onEditProfile: (publicId: string) => void;
  onSchedule: (publicId: string) => void;
}

// Derives initials from a full name for the avatar fallback
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Formats a date string into a human-readable joined date
function formatJoinedDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Card that displays a doctor's profile, contact info, and admin actions
export function DoctorCard({ doctor, onViewDetails, onRemove, onEditProfile, onSchedule }: DoctorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-5">
          {/* Three-dot menu */}
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground"
                  aria-label="Doctor options"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                <DropdownMenuItem onSelect={() => onViewDetails(doctor.publicId)}>
                  <Eye className="mr-2 size-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => onRemove(doctor.publicId)}>
                  <Trash2 className="mr-2 size-4" />
                  Remove Doctor
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Avatar + name + department row */}
          <div className="flex items-center gap-3 pr-8">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
                "bg-primary",
              )}
            >
              {doctor.avatarUrl ? (
                <img
                  src={doctor.avatarUrl}
                  alt={`${doctor.name} avatar`}
                  className="size-full rounded-full object-cover"
                />
              ) : (
                getInitials(doctor.name)
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight">{doctor.name}</p>
              <p className="truncate text-sm text-muted-foreground">{doctor.specialty}</p>
              <p className="truncate text-xs text-muted-foreground">{doctor.department}</p>
            </div>
          </div>

          {/* License number badge */}
          <div className="mt-3">
            <Badge variant="outline">License No. {doctor.licenseNo}</Badge>
          </div>

          {/* Contact + metadata */}
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail className="size-4 shrink-0" />
              <span className="truncate">{doctor.email}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" />
              <span>{doctor.phone}</span>
            </li>
            <li className="flex items-center gap-2">
              <CalendarDays className="size-4 shrink-0" />
              <span>Joined {formatJoinedDate(doctor.joinedDate)}</span>
            </li>
            <li className="flex items-center gap-2">
              <Wallet className="size-4 shrink-0" />
              <span>
                RM {doctor.feePerSessionMyr.toLocaleString("en-MY", { minimumFractionDigits: 2 })} /
                session
              </span>
            </li>
          </ul>

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEditProfile(doctor.publicId)}
            >
              <Pencil className="mr-2 size-4" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onSchedule(doctor.publicId)}
            >
              <CalendarClock className="mr-2 size-4" />
              Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Demo data for development — remove once wired to the API
export const demoDoctors: Doctor[] = [
  {
    publicId: "a1b2c3d4-0001-0000-0000-000000000001",
    name: "Dr. James Wilson",
    specialty: "Orthopedics",
    department: "Surgery",
    email: "j.wilson@clinicos.com",
    phone: "+1 (555) 012-1122",
    joinedDate: "2021-03-15",
    feePerSessionMyr: 250,
    isOnDuty: true,
    licenseNo: "MMC-2021-001234",
  },
  {
    publicId: "a1b2c3d4-0001-0000-0000-000000000002",
    name: "Dr. Aisha Rahman",
    specialty: "Cardiology",
    department: "Internal Medicine",
    email: "a.rahman@clinicos.com",
    phone: "+60 12-345 6789",
    joinedDate: "2019-08-01",
    feePerSessionMyr: 320,
    isOnDuty: false,
    licenseNo: "MMC-2019-005678",
  },
  {
    publicId: "a1b2c3d4-0001-0000-0000-000000000003",
    name: "Dr. Lim Wei Jie",
    specialty: "Dermatology",
    department: "Outpatient",
    email: "lim.weijie@clinicos.com",
    phone: "+60 11-888 9900",
    joinedDate: "2023-01-10",
    feePerSessionMyr: 180,
    isOnDuty: true,
    licenseNo: "MMC-2023-009012",
  },
];
