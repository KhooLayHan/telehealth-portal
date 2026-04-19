import { Link } from "@tanstack/react-router";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  GraduationCap,
  Mail,
  Pencil,
  Phone,
  Search,
  Stethoscope,
  UserCheck,
  UserX,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ACCENT = "#0d9488";
const PAGE_SIZE = 10;

// Shape of a single academic or professional qualification
interface Qualification {
  degree: string;
  institution: string;
  year: number;
}

// Address in JSONB form as stored in the database
interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Full doctor row including extra fields shown only in the detail dialog
interface DoctorRow {
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty: string;
  department: string;
  licenseNumber: string;
  consultationFee: number;
  phoneNumber: string;
  slug: string;
  isActive: boolean;
  // Extended fields (from users + doctors tables, not shown in table columns)
  gender: "M" | "F" | "O" | "N";
  dateOfBirth: string;
  avatarUrl?: string;
  address: Address;
  qualifications: Qualification[];
  bio: string;
  languages: string[];
}

const DEMO_DOCTORS: DoctorRow[] = [
  {
    publicId: "d1a2b3c4-0001-0000-0000-000000000001",
    firstName: "Aisha",
    lastName: "Rahman",
    email: "aisha.rahman@telehealth.dev",
    specialty: "Cardiology",
    department: "Cardiology",
    licenseNumber: "MMC-10021",
    consultationFee: 150,
    phoneNumber: "+60 11-1234 5678",
    slug: "aisha-rahman",
    isActive: true,
    gender: "F",
    dateOfBirth: "1982-04-15",
    address: {
      street: "12 Jalan Ampang",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "50450",
      country: "MY",
    },
    qualifications: [
      { degree: "MBBS", institution: "University of Malaya", year: 2007 },
      { degree: "Fellowship in Cardiology", institution: "National Heart Institute", year: 2013 },
    ],
    bio: "Dr. Aisha Rahman is a board-certified cardiologist with over 15 years of experience in interventional cardiology. She specialises in complex coronary interventions and heart failure management. Fluent in English and Bahasa Malaysia.",
    languages: ["English", "Bahasa Malaysia"],
  },
  {
    publicId: "d1a2b3c4-0001-0000-0000-000000000002",
    firstName: "Benjamin",
    lastName: "Tan",
    email: "benjamin.tan@telehealth.dev",
    specialty: "Neurology",
    department: "Neurology",
    licenseNumber: "MMC-10022",
    consultationFee: 180,
    phoneNumber: "+60 12-9876 5432",
    slug: "benjamin-tan",
    isActive: true,
    gender: "M",
    dateOfBirth: "1978-09-22",
    address: {
      street: "88 Jalan Bukit Bintang",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "55100",
      country: "MY",
    },
    qualifications: [
      { degree: "MD", institution: "Universiti Kebangsaan Malaysia", year: 2003 },
      { degree: "PhD Neuroscience", institution: "Imperial College London", year: 2009 },
    ],
    bio: "Dr. Benjamin Tan is a consultant neurologist specialising in stroke management and epilepsy. He leads the neurology department's research programme and has published over 30 peer-reviewed articles. Fluent in English, Malay, and Mandarin.",
    languages: ["English", "Bahasa Malaysia", "Mandarin"],
  },
  {
    publicId: "d1a2b3c4-0001-0000-0000-000000000003",
    firstName: "Chitra",
    lastName: "Subramaniam",
    email: "chitra.subramaniam@telehealth.dev",
    specialty: "Dermatology",
    department: "Dermatology",
    licenseNumber: "MMC-10023",
    consultationFee: 120,
    phoneNumber: "+60 16-3344 5566",
    slug: "chitra-subramaniam",
    isActive: false,
    gender: "F",
    dateOfBirth: "1985-11-30",
    address: {
      street: "3 Lorong Masjid India",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "50100",
      country: "MY",
    },
    qualifications: [
      { degree: "MBBS", institution: "Manipal University", year: 2010 },
      { degree: "Diploma in Dermatology", institution: "Cardiff University", year: 2014 },
    ],
    bio: "Dr. Chitra Subramaniam focuses on medical and cosmetic dermatology, with expertise in acne, eczema, and skin cancer screening. She is passionate about patient education and preventive skincare. Speaks English, Tamil, and Bahasa Malaysia.",
    languages: ["English", "Tamil", "Bahasa Malaysia"],
  },
  {
    publicId: "d1a2b3c4-0001-0000-0000-000000000004",
    firstName: "David",
    lastName: "Lim",
    email: "david.lim@telehealth.dev",
    specialty: "Orthopaedics",
    department: "Orthopedics",
    licenseNumber: "MMC-10024",
    consultationFee: 200,
    phoneNumber: "+60 17-2233 4455",
    slug: "david-lim",
    isActive: true,
    gender: "M",
    dateOfBirth: "1975-06-08",
    address: {
      street: "45 Jalan Duta",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "50480",
      country: "MY",
    },
    qualifications: [
      { degree: "MBBS", institution: "University of Malaya", year: 2000 },
      { degree: "Masters in Orthopaedic Surgery", institution: "University of Malaya", year: 2006 },
      {
        degree: "Fellowship in Sports Medicine",
        institution: "University of Melbourne",
        year: 2009,
      },
    ],
    bio: "Dr. David Lim is a consultant orthopaedic surgeon with 20+ years of experience in joint replacement, arthroscopy, and sports injury rehabilitation. He is the team physician for several national sports associations.",
    languages: ["English", "Bahasa Malaysia", "Cantonese"],
  },
  {
    publicId: "d1a2b3c4-0001-0000-0000-000000000005",
    firstName: "Elena",
    lastName: "Wong",
    email: "elena.wong@telehealth.dev",
    specialty: "Paediatrics",
    department: "Pediatrics",
    licenseNumber: "MMC-10025",
    consultationFee: 130,
    phoneNumber: "+60 18-6677 8899",
    slug: "elena-wong",
    isActive: true,
    gender: "F",
    dateOfBirth: "1988-02-14",
    address: {
      street: "9 Jalan Semantan",
      city: "Petaling Jaya",
      state: "Selangor",
      postalCode: "47301",
      country: "MY",
    },
    qualifications: [
      { degree: "MBBS", institution: "International Medical University", year: 2013 },
      {
        degree: "MRCPCH",
        institution: "Royal College of Paediatrics and Child Health",
        year: 2017,
      },
    ],
    bio: "Dr. Elena Wong is a paediatric specialist dedicated to the health and wellbeing of children from birth through adolescence. She has a special interest in developmental paediatrics and childhood immunisation programmes.",
    languages: ["English", "Mandarin", "Hokkien"],
  },
  {
    publicId: "d1a2b3c4-0001-0000-0000-000000000006",
    firstName: "Farid",
    lastName: "Abdullah",
    email: "farid.abdullah@telehealth.dev",
    specialty: "General Practice",
    department: "General Practice",
    licenseNumber: "MMC-10026",
    consultationFee: 80,
    phoneNumber: "+60 19-5544 3322",
    slug: "farid-abdullah",
    isActive: true,
    gender: "M",
    dateOfBirth: "1990-07-25",
    address: {
      street: "22 Taman Tun Dr Ismail",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "60000",
      country: "MY",
    },
    qualifications: [
      { degree: "MBBS", institution: "Universiti Sains Malaysia", year: 2015 },
      {
        degree: "Certificate in Family Medicine",
        institution: "Academy of Family Physicians Malaysia",
        year: 2019,
      },
    ],
    bio: "Dr. Farid Abdullah is a family medicine physician committed to holistic, patient-centred primary care. He manages chronic diseases, preventive health, and minor surgical procedures with a warm bedside manner.",
    languages: ["English", "Bahasa Malaysia"],
  },
  {
    publicId: "d1a2b3c4-0001-0000-0000-000000000007",
    firstName: "Grace",
    lastName: "Ng",
    email: "grace.ng@telehealth.dev",
    specialty: "Psychiatry",
    department: "General Practice",
    licenseNumber: "MMC-10027",
    consultationFee: 160,
    phoneNumber: "+60 11-8877 6655",
    slug: "grace-ng",
    isActive: false,
    gender: "F",
    dateOfBirth: "1983-12-03",
    address: {
      street: "6 Jalan Imbi",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "55100",
      country: "MY",
    },
    qualifications: [
      { degree: "MBBS", institution: "University of Malaya", year: 2008 },
      { degree: "MMed Psychiatry", institution: "University of Malaya", year: 2013 },
    ],
    bio: "Dr. Grace Ng is a consultant psychiatrist with a special interest in mood disorders, anxiety, and trauma-informed care. She provides evidence-based therapy and pharmacological management with a compassionate, integrative approach.",
    languages: ["English", "Bahasa Malaysia", "Mandarin"],
  },
  {
    publicId: "d1a2b3c4-0001-0000-0000-000000000008",
    firstName: "Hassan",
    lastName: "Malik",
    email: "hassan.malik@telehealth.dev",
    specialty: "Ophthalmology",
    department: "General Practice",
    licenseNumber: "MMC-10028",
    consultationFee: 140,
    phoneNumber: "+60 12-1122 3344",
    slug: "hassan-malik",
    isActive: true,
    gender: "M",
    dateOfBirth: "1980-03-17",
    address: {
      street: "100 Jalan Raja Chulan",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "50200",
      country: "MY",
    },
    qualifications: [
      { degree: "MBBS", institution: "Universiti Kebangsaan Malaysia", year: 2005 },
      {
        degree: "Masters in Ophthalmology",
        institution: "Universiti Kebangsaan Malaysia",
        year: 2011,
      },
    ],
    bio: "Dr. Hassan Malik is an ophthalmologist specialising in cataract surgery, glaucoma management, and refractive surgery. He has performed over 5,000 cataract operations and is trained in advanced phacoemulsification techniques.",
    languages: ["English", "Bahasa Malaysia", "Urdu"],
  },
  {
    publicId: "d1a2b3c4-0001-0000-0000-000000000009",
    firstName: "Irene",
    lastName: "Chan",
    email: "irene.chan@telehealth.dev",
    specialty: "Oncology",
    department: "General Practice",
    licenseNumber: "MMC-10029",
    consultationFee: 220,
    phoneNumber: "+60 16-9988 7766",
    slug: "irene-chan",
    isActive: true,
    gender: "F",
    dateOfBirth: "1977-08-19",
    address: {
      street: "25 Jalan Parlimen",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "50480",
      country: "MY",
    },
    qualifications: [
      { degree: "MBBS", institution: "University of Malaya", year: 2002 },
      {
        degree: "Fellowship in Medical Oncology",
        institution: "National Cancer Institute Singapore",
        year: 2008,
      },
      {
        degree: "Sub-speciality in Breast Oncology",
        institution: "MD Anderson Cancer Center",
        year: 2010,
      },
    ],
    bio: "Dr. Irene Chan is a senior consultant oncologist with expertise in breast and gynaecological cancers. She leads the multidisciplinary tumour board and is involved in several international clinical trials focusing on targeted therapy.",
    languages: ["English", "Mandarin", "Cantonese"],
  },
  {
    publicId: "d1a2b3c4-0001-0000-0000-000000000010",
    firstName: "Johan",
    lastName: "Ibrahim",
    email: "johan.ibrahim@telehealth.dev",
    specialty: "Endocrinology",
    department: "General Practice",
    licenseNumber: "MMC-10030",
    consultationFee: 170,
    phoneNumber: "+60 17-4455 6677",
    slug: "johan-ibrahim",
    isActive: true,
    gender: "M",
    dateOfBirth: "1981-01-11",
    address: {
      street: "7 Jalan Cochrane",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "55100",
      country: "MY",
    },
    qualifications: [
      { degree: "MBBS", institution: "Universiti Putra Malaysia", year: 2006 },
      { degree: "MMed Internal Medicine", institution: "Universiti Putra Malaysia", year: 2012 },
      {
        degree: "Fellowship in Endocrinology",
        institution: "Singapore General Hospital",
        year: 2015,
      },
    ],
    bio: "Dr. Johan Ibrahim is an endocrinologist specialising in diabetes management, thyroid disorders, and osteoporosis. He runs a dedicated diabetes education clinic and works closely with dietitians and diabetes nurse educators.",
    languages: ["English", "Bahasa Malaysia"],
  },
  {
    publicId: "d1a2b3c4-0001-0000-0000-000000000011",
    firstName: "Karen",
    lastName: "Yap",
    email: "karen.yap@telehealth.dev",
    specialty: "Rheumatology",
    department: "General Practice",
    licenseNumber: "MMC-10031",
    consultationFee: 190,
    phoneNumber: "+60 18-3322 1100",
    slug: "karen-yap",
    isActive: true,
    gender: "F",
    dateOfBirth: "1984-05-27",
    address: {
      street: "50 Jalan Tun Razak",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "50400",
      country: "MY",
    },
    qualifications: [
      { degree: "MBBS", institution: "MAHSA University", year: 2009 },
      { degree: "MRCP Rheumatology", institution: "Royal College of Physicians", year: 2014 },
    ],
    bio: "Dr. Karen Yap is a rheumatologist with expertise in autoimmune and musculoskeletal diseases including rheumatoid arthritis, lupus, and gout. She is an advocate for biologic therapy access and runs patient support groups.",
    languages: ["English", "Mandarin", "Hakka"],
  },
  {
    publicId: "d1a2b3c4-0001-0000-0000-000000000012",
    firstName: "Luqman",
    lastName: "Hakim",
    email: "luqman.hakim@telehealth.dev",
    specialty: "Gastroenterology",
    department: "General Practice",
    licenseNumber: "MMC-10032",
    consultationFee: 155,
    phoneNumber: "+60 19-6677 8800",
    slug: "luqman-hakim",
    isActive: false,
    gender: "M",
    dateOfBirth: "1986-10-04",
    address: {
      street: "14 Jalan P. Ramlee",
      city: "Kuala Lumpur",
      state: "Wilayah Persekutuan",
      postalCode: "50250",
      country: "MY",
    },
    qualifications: [
      { degree: "MBBS", institution: "Universiti Teknologi MARA", year: 2011 },
      {
        degree: "Fellowship in Gastroenterology",
        institution: "University of Queensland",
        year: 2017,
      },
    ],
    bio: "Dr. Luqman Hakim is a consultant gastroenterologist specialising in inflammatory bowel disease, liver conditions, and advanced therapeutic endoscopy. He is trained in ERCP and EUS procedures.",
    languages: ["English", "Bahasa Malaysia"],
  },
];

// Maps gender code to a readable label
function genderLabel(code: "M" | "F" | "O" | "N"): string {
  const map: Record<string, string> = { M: "Male", F: "Female", O: "Other", N: "Not specified" };
  return map[code] ?? code;
}

// Formats a YYYY-MM-DD date string as "15 Apr 1982"
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface DetailRowProps {
  label: string;
  value: string;
}

// A single labelled row inside the detail dialog
function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

interface DoctorDetailsDialogProps {
  doctor: DoctorRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal dialog that shows full doctor profile not visible in the table
function DoctorDetailsDialog({ doctor, open, onOpenChange }: DoctorDetailsDialogProps) {
  if (!doctor) return null;

  const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`;
  const fullAddress = `${doctor.address.street}, ${doctor.address.city}, ${doctor.address.state} ${doctor.address.postalCode}, ${doctor.address.country}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Header band with accent colour */}
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: ACCENT }} />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-4">
            {/* Avatar / initials */}
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ background: ACCENT }}
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-semibold leading-none">
                  Dr. {doctor.firstName} {doctor.lastName}
                </DialogTitle>
                <Badge variant={doctor.isActive ? "default" : "secondary"} className="shrink-0">
                  {doctor.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="flex items-center gap-1">
                  <Stethoscope className="size-3.5 shrink-0" />
                  {doctor.specialty}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-mono text-xs">{doctor.licenseNumber}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
          {/* Bio */}
          {doctor.bio && (
            <div className="mb-5 rounded-lg bg-muted/50 px-4 py-3 text-sm leading-relaxed text-foreground/80">
              {doctor.bio}
            </div>
          )}

          {/* Personal details */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Personal Information
          </p>
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailRow label="Gender" value={genderLabel(doctor.gender)} />
            <DetailRow label="Date of Birth" value={formatDate(doctor.dateOfBirth)} />
            <DetailRow label="Consultation Fee" value={`RM ${doctor.consultationFee.toFixed(2)}`} />
          </div>

          {/* Contact details */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Contact Details
          </p>
          <div className="mb-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Mail className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm">{doctor.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="font-mono text-sm">{doctor.phoneNumber || "—"}</span>
            </div>
          </div>
          <div className="mb-5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground/80">
            {fullAddress}
          </div>

          {/* Qualifications */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Qualifications
          </p>
          <div className="mb-5 space-y-2">
            {doctor.qualifications.map((q) => (
              <div
                key={`${q.degree}-${q.year}`}
                className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
              >
                <GraduationCap className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{q.degree}</p>
                  <p className="text-xs text-muted-foreground">
                    {q.institution} · {q.year}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Languages */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Languages Spoken
          </p>
          <div className="flex flex-wrap gap-2">
            {doctor.languages.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: `${ACCENT}18`, color: ACCENT }}
              >
                <BadgeCheck className="size-3 shrink-0" />
                {lang}
              </span>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const columns: ColumnDef<DoctorRow>[] = [
  {
    accessorKey: "firstName",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.firstName} {row.original.lastName}
      </span>
    ),
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => <span className="text-sm">{row.getValue("department")}</span>,
  },
  {
    accessorKey: "specialty",
    header: "Specialty",
    cell: ({ row }) => (
      <span
        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
        style={{ borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}12` }}
      >
        {row.getValue("specialty")}
      </span>
    ),
  },
  {
    accessorKey: "licenseNumber",
    header: "License No.",
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("licenseNumber")}</span>,
  },
  {
    accessorKey: "consultationFee",
    header: "Fee (MYR)",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        RM {row.getValue<number>("consultationFee").toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">{row.getValue("email")}</span>
    ),
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue("phoneNumber") || "—"}</span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const active = row.getValue<boolean>("isActive");
      return (
        <Badge variant={active ? "default" : "secondary"}>{active ? "Active" : "Inactive"}</Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          title="View details"
          onClick={() =>
            (table.options.meta as { onView: (d: DoctorRow) => void }).onView(row.original)
          }
        >
          <Eye className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          title="Edit doctor"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${row.original.isActive ? "text-muted-foreground hover:text-destructive" : "text-muted-foreground hover:text-emerald-600"}`}
          title={row.original.isActive ? "Deactivate doctor" : "Reactivate doctor"}
        >
          {row.original.isActive ? (
            <UserX className="size-3.5" />
          ) : (
            <UserCheck className="size-3.5" />
          )}
        </Button>
      </div>
    ),
  },
];

interface DataTableProps {
  data: DoctorRow[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onView: (doctor: DoctorRow) => void;
}

function DataTable({
  data,
  page,
  totalPages,
  onPageChange,
  search,
  onSearchChange,
  onView,
}: DataTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { onView },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      <div className="relative w-72">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, specialty or license…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 pl-9 text-sm"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-foreground/20 bg-foreground hover:bg-foreground"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  className="border-b border-border transition-colors duration-100 hover:bg-muted/50"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-5 py-3.5 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <p className="text-sm text-muted-foreground">No doctors found.</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    Try adjusting your search.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-medium text-foreground">{page}</span> of{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                  acc.push(`ellipsis-after-${arr[idx - 1]}`);
                acc.push(p);
                return acc;
              }, [])
              .map((item) =>
                typeof item === "string" ? (
                  <span key={item} className="px-1 text-xs text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs"
                    style={item === page ? { background: ACCENT } : undefined}
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </Button>
                ),
              )}

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminDoctorsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleView = (doctor: DoctorRow) => {
    setSelectedDoctor(doctor);
    setDialogOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filtered = useMemo(() => {
    if (!search) return DEMO_DOCTORS;
    const q = search.toLowerCase();
    return DEMO_DOCTORS.filter(
      (d) =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.department.toLowerCase().includes(q) ||
        d.licenseNumber.toLowerCase().includes(q),
    );
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Doctor List</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="mt-0.5 text-sm text-muted-foreground">
          View and manage all registered doctors
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="relative overflow-hidden rounded-xl border border-border bg-card">
          <div className="absolute inset-x-0 top-0 h-0.75" style={{ background: ACCENT }} />

          <div className="flex items-end justify-between px-6 pb-4 pt-6">
            <div>
              <p
                className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: ACCENT }}
              >
                Doctors
              </p>
              <h1 className="text-2xl font-semibold leading-none tracking-tight">All Doctors</h1>
            </div>

            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
              {filtered.length === 1 ? "doctor" : "doctors"} found
            </p>
          </div>

          <Separator />

          <div className="p-6">
            <DataTable
              data={paged}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              search={searchInput}
              onSearchChange={setSearchInput}
              onView={handleView}
            />
          </div>
        </div>
      </motion.div>

      <DoctorDetailsDialog doctor={selectedDoctor} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
