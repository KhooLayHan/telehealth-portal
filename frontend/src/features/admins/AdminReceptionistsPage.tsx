import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye, Pencil, Search, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  getAdminGetAllReceptionistsQueryKey,
  useAdminGetAllReceptionists,
  useAdminUpdateReceptionist,
} from "@/api/generated/admins/admins";
import type { AdminReceptionistDto } from "@/api/model/AdminReceptionistDto";
import { ApiError } from "@/api/ofetch-mutator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Maps gender code to a readable label
function genderLabel(code: string): string {
  const map: Record<string, string> = { M: "Male", F: "Female", O: "Other", N: "Not specified" };
  return map[code] ?? code;
}

// Formats a date string as "15 Apr 1982"
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

// Zod schema for validating the receptionist edit form
const editReceptionistSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Must be a valid email"),
  phoneNumber: z.string(),
  gender: z.enum(["M", "F", "O", "N"], { message: "Select a gender" }),
  dateOfBirth: z.string(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
});

interface EditReceptionistDialogProps {
  receptionist: AdminReceptionistDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Reusable labeled field wrapper used in the edit form
function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-foreground/80">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Modal dialog that lets the admin edit a receptionist's details
function EditReceptionistDialog({ receptionist, open, onOpenChange }: EditReceptionistDialogProps) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useAdminUpdateReceptionist({
    mutation: {
      onSuccess: () => {
        toast.success("Receptionist updated successfully");
        queryClient.invalidateQueries({ queryKey: getAdminGetAllReceptionistsQueryKey() });
        onOpenChange(false);
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          toast.error(error.data.title ?? "Failed to update receptionist");
        }
      },
    },
  });

  const form = useForm({
    defaultValues: {
      firstName: receptionist?.firstName ?? "",
      lastName: receptionist?.lastName ?? "",
      username: receptionist?.username ?? "",
      email: receptionist?.email ?? "",
      phoneNumber: receptionist?.phoneNumber ?? "",
      gender: (receptionist?.gender ?? "N") as "M" | "F" | "O" | "N",
      dateOfBirth: receptionist?.dateOfBirth ?? "",
      street: receptionist?.address?.street ?? "",
      city: receptionist?.address?.city ?? "",
      state: receptionist?.address?.state ?? "",
      postalCode: receptionist?.address?.postalCode ?? "",
      country: receptionist?.address?.country ?? "",
    },
    validators: { onSubmit: editReceptionistSchema },
    onSubmit: async ({ value }) => {
      if (!receptionist?.publicId) return;
      mutate({
        id: receptionist.publicId,
        data: {
          firstName: value.firstName,
          lastName: value.lastName,
          username: value.username,
          email: value.email,
          phoneNumber: value.phoneNumber || null,
          gender: value.gender,
          dateOfBirth: value.dateOfBirth,
          address: value.street
            ? {
                street: value.street,
                city: value.city,
                state: value.state,
                postalCode: value.postalCode,
                country: value.country,
              }
            : null,
        },
      });
    },
  });

  if (!receptionist) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Header accent band */}
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: ACCENT }} />

        <DialogHeader className="px-6 pb-4 pt-7">
          <DialogTitle className="text-xl font-semibold">Edit Receptionist</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update the details for{" "}
            <span className="font-medium text-foreground">
              {receptionist.firstName} {receptionist.lastName}
            </span>
            . Changes are not saved until you click Save.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="max-h-[60vh] overflow-y-auto px-6 pb-2">
            {/* Personal information section */}
            <p
              className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: ACCENT }}
            >
              Personal Information
            </p>
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.Field name="firstName">
                {(field) => (
                  <FormField
                    label="First Name"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="First name"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="lastName">
                {(field) => (
                  <FormField
                    label="Last Name"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Last name"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="username">
                {(field) => (
                  <FormField
                    label="Username"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="username"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="email">
                {(field) => (
                  <FormField
                    label="Email"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      type="email"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="email@example.com"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="phoneNumber">
                {(field) => (
                  <FormField
                    label="Phone Number"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="+60 12-345 6789"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="gender">
                {(field) => (
                  <FormField
                    label="Gender"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange((v ?? "N") as "M" | "F" | "O" | "N")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                        <SelectItem value="O">Other</SelectItem>
                        <SelectItem value="N">Not specified</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              </form.Field>

              <form.Field name="dateOfBirth">
                {(field) => (
                  <FormField
                    label="Date of Birth"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      type="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </FormField>
                )}
              </form.Field>
            </div>

            {/* Address section */}
            <p
              className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: ACCENT }}
            >
              Address
            </p>
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <form.Field name="street">
                  {(field) => (
                    <FormField
                      label="Street"
                      error={
                        field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                      }
                    >
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="123 Main St"
                      />
                    </FormField>
                  )}
                </form.Field>
              </div>

              <form.Field name="city">
                {(field) => (
                  <FormField
                    label="City"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Kuala Lumpur"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="state">
                {(field) => (
                  <FormField
                    label="State"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Selangor"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="postalCode">
                {(field) => (
                  <FormField
                    label="Postal Code"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="50000"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="country">
                {(field) => (
                  <FormField
                    label="Country"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Malaysia"
                    />
                  </FormField>
                )}
              </form.Field>
            </div>
          </div>

          <Separator />

          <DialogFooter className="px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  disabled={isSubmitting || isPending}
                  style={{ background: ACCENT }}
                  className="text-white hover:opacity-90"
                >
                  {isSubmitting || isPending ? "Saving…" : "Save changes"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ReceptionistDetailsDialogProps {
  receptionist: AdminReceptionistDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal dialog that shows full receptionist profile not visible in the table
function ReceptionistDetailsDialog({
  receptionist,
  open,
  onOpenChange,
}: ReceptionistDetailsDialogProps) {
  if (!receptionist) return null;

  const initials = `${receptionist.firstName[0]}${receptionist.lastName[0]}`;
  const fullAddress = receptionist.address
    ? `${receptionist.address.street}, ${receptionist.address.city}, ${receptionist.address.state} ${receptionist.address.postalCode}, ${receptionist.address.country}`
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Header accent band */}
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: ACCENT }} />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-4">
            {/* Avatar with S3 image or initials fallback */}
            {receptionist.avatarUrl ? (
              <img
                src={receptionist.avatarUrl}
                alt={`${receptionist.firstName} ${receptionist.lastName}`}
                className="size-14 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ background: ACCENT }}
              >
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-semibold leading-none">
                  {receptionist.firstName} {receptionist.lastName}
                </DialogTitle>
              </div>
              <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-mono text-xs text-muted-foreground">
                  @{receptionist.username}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
          {/* Personal details */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Personal Information
          </p>
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailRow label="IC Number" value={receptionist.icNumber} />
            <DetailRow label="Gender" value={genderLabel(receptionist.gender)} />
            <DetailRow
              label="Date of Birth"
              value={receptionist.dateOfBirth ? formatDate(receptionist.dateOfBirth) : "—"}
            />
          </div>

          {/* Contact details */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Address
          </p>
          <div className="mb-5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground/80">
            {fullAddress}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Column definitions for the receptionists data table
const columns: ColumnDef<AdminReceptionistDto>[] = [
  {
    accessorKey: "firstName",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">
          {row.original.firstName} {row.original.lastName}
        </span>
        <span className="font-mono text-xs text-muted-foreground">@{row.original.username}</span>
      </div>
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
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDate(row.getValue("createdAt"))}</span>
    ),
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
            (
              table.options.meta as {
                onView: (r: AdminReceptionistDto) => void;
                onEdit: (r: AdminReceptionistDto) => void;
              }
            ).onView(row.original)
          }
        >
          <Eye className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          title="Edit receptionist"
          onClick={() =>
            (
              table.options.meta as {
                onView: (r: AdminReceptionistDto) => void;
                onEdit: (r: AdminReceptionistDto) => void;
              }
            ).onEdit(row.original)
          }
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          title="Deactivate receptionist"
        >
          <UserX className="size-3.5" />
        </Button>
      </div>
    ),
  },
];

interface DataTableProps {
  data: AdminReceptionistDto[];
  page: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onView: (receptionist: AdminReceptionistDto) => void;
  onEdit: (receptionist: AdminReceptionistDto) => void;
}

// Paginated and searchable data table for the receptionists list
function DataTable({
  data,
  page,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  search,
  onSearchChange,
  onView,
  onEdit,
}: DataTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { onView, onEdit },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      <div className="relative w-72">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, department or ID…"
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
                  <p className="text-sm text-muted-foreground">No receptionists found.</p>
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
              disabled={!hasPreviousPage}
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
              disabled={!hasNextPage}
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

// Admin page displaying a paginated, searchable list of all receptionists
export function AdminReceptionistsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedReceptionist, setSelectedReceptionist] = useState<AdminReceptionistDto | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editReceptionist, setEditReceptionist] = useState<AdminReceptionistDto | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleView = (receptionist: AdminReceptionistDto) => {
    setSelectedReceptionist(receptionist);
    setDialogOpen(true);
  };

  const handleEdit = (receptionist: AdminReceptionistDto) => {
    setEditReceptionist(receptionist);
    setEditDialogOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useAdminGetAllReceptionists({
    Page: page,
    PageSize: PAGE_SIZE,
    Search: search || undefined,
  });

  const result = data?.status === 200 ? data.data : null;
  const receptionists = result?.items ?? [];
  const totalCount = result ? Number(result.totalCount) : 0;
  const totalPages = result ? Number(result.totalPages ?? 1) : 1;

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
              <BreadcrumbPage>Receptionist List</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="mt-0.5 text-sm text-muted-foreground">
          View and manage all registered receptionists
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
                Receptionists
              </p>
              <h1 className="text-2xl font-semibold leading-none tracking-tight">
                All Receptionists
              </h1>
            </div>

            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{totalCount}</span>{" "}
              {totalCount === 1 ? "receptionist" : "receptionists"} found
            </p>
          </div>

          <Separator />

          <div className="p-6">
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-sm text-muted-foreground tracking-wide">
                  Loading receptionists…
                </p>
              </div>
            ) : isError ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-sm text-destructive">Failed to load receptionists.</p>
              </div>
            ) : (
              <DataTable
                data={receptionists}
                page={page}
                totalPages={totalPages}
                hasNextPage={result?.hasNextPage}
                hasPreviousPage={result?.hasPreviousPage}
                onPageChange={setPage}
                search={searchInput}
                onSearchChange={setSearchInput}
                onView={handleView}
                onEdit={handleEdit}
              />
            )}
          </div>
        </div>
      </motion.div>

      <ReceptionistDetailsDialog
        receptionist={selectedReceptionist}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <EditReceptionistDialog
        key={editReceptionist?.publicId}
        receptionist={editReceptionist}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </>
  );
}
