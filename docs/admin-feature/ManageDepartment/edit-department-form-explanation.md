# EditDepartmentForm.tsx Explanation

## Short Version
`EditDepartmentForm.tsx` renders the modal used by admins to update an existing department. It pre-fills the current department values, validates user input with Zod through TanStack Form, then sends the update request via the Orval-generated `useAdminUpdateDepartment` mutation hook. After a successful update, it shows a toast, invalidates the department-list query so the table refreshes, and closes the dialog.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDepartments/EditDepartmentForm.tsx` | Main file being explained; owns dialog UI, validation, submit logic, and mutation wiring. |
| `frontend/src/features/admins/AdminDepartmentPage.tsx` | Shows where `EditDepartmentForm` is mounted and how selected department state opens/closes the dialog. |
| `frontend/src/features/admins/manageDepartments/UseDepartmentsTable.tsx` | Defines `DepartmentTableRow` shape consumed by `EditDepartmentForm` and maps backend data (`slug`) into `id`. |
| `frontend/src/api/generated/admins/admins.ts` | Generated API hook definitions used by this form: `useAdminUpdateDepartment` and query key invalidation helper. |

## Technical Flow
1. **Parent page controls dialog state**: `AdminDepartmentPage` keeps `editingDepartment` and `editDepartmentOpen` in React state. Clicking edit in the table sets the selected department and opens the form modal.
2. **Guard before rendering**: `EditDepartmentForm` returns `null` when no department is selected, so the modal only exists when there is concrete data to edit.
3. **Mount with stable defaults**: When a department is present, the component renders `EditDepartmentFormContent` with `key={department.id}`. This key forces a clean form instance if user switches to editing a different department.
4. **Client-side validation**: `editDepartmentSchema` enforces required name, trims whitespace, and limits both name and description length.
5. **Submit mutation**: On submit, values are trimmed and sent to `useAdminUpdateDepartment` with `slug: department.id` (where `id` is actually the backend slug from table mapping).
6. **Success behavior**: Success shows a confirmation toast, invalidates `getAdminGetAllDepartmentsQueryKey()` so the table refetches fresh data, then closes dialog.
7. **Error behavior**: If API error is typed (`ApiError`), the form shows backend problem title; otherwise, it shows a generic failure toast.
8. **Cancel/close behavior**: When dialog closes (Cancel button, escape, or outside click), form resets back to selected department values so partial edits are discarded.

## Frontend Code
From `frontend/src/features/admins/manageDepartments/EditDepartmentForm.tsx`:

```tsx
const editDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Department name is required")
    .max(MAX_DEPARTMENT_NAME_LENGTH, "Department name must be 100 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(MAX_DEPARTMENT_DESCRIPTION_LENGTH, "Description must be 500 characters or fewer"),
});
```

This schema is the form safety net on the client side: users cannot submit an empty name, and both fields are length-limited after trimming spaces.

From `frontend/src/features/admins/manageDepartments/EditDepartmentForm.tsx`:

```tsx
const { mutateAsync, isPending } = useAdminUpdateDepartment({
  mutation: {
    onSuccess: async () => {
      toast.success("Department details updated successfully");
      await queryClient.invalidateQueries({ queryKey: getAdminGetAllDepartmentsQueryKey() });
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.data.title ?? "Failed to update department");
        return;
      }

      toast.error("Failed to update department");
    },
  },
});
```

This mutation hook is the generated frontend wrapper over the backend update endpoint. It coordinates user feedback (toasts), data freshness (query invalidation), and modal state (close on success).

From `frontend/src/features/admins/manageDepartments/EditDepartmentForm.tsx`:

```tsx
onSubmit: async ({ value }) => {
  const description = value.description.trim();

  await mutateAsync({
    slug: department.id,
    data: {
      name: value.name.trim(),
      description: description.length > 0 ? description : null,
    },
  });
},
```

The submit handler transforms UI input into API payload shape:
- sends `slug` as path parameter
- trims `name`
- converts blank description to `null` so backend stores it as optional

From `frontend/src/features/admins/manageDepartments/EditDepartmentForm.tsx`:

```tsx
const handleOpenChange = (nextOpen: boolean) => {
  if (!nextOpen) {
    form.reset(buildEditDepartmentValues(department));
  }

  onOpenChange(nextOpen);
};
```

This prevents stale half-edited form state. Every close restores the current department values.

## Backend Code
This file does **not** directly include backend endpoint code, but it uses generated contracts from `frontend/src/api/generated/admins/admins.ts`:

```ts
export const adminUpdateDepartment = async (slug: string,
    adminUpdateDepartmentCommand: AdminUpdateDepartmentCommand, options?: RequestInit)

export const useAdminUpdateDepartment = <TError = adminUpdateDepartmentResponseError,
    TContext = unknown>(options?: { mutation?: UseMutationOptions<...> })
```

And this response typing indicates expected error branches:
- `401` (unauthenticated)
- `403` (forbidden)
- `404` (department not found)
- `409` (conflict)
- `422` (validation)

So even though the component validates locally, backend validation/authorization still applies and is surfaced via `ApiError` handling.

## End-to-End Code Flow
1. Admin clicks edit action from the departments table.
2. `AdminDepartmentPage` sets `editingDepartment` and opens `EditDepartmentForm`.
3. `EditDepartmentForm` renders with selected row values as defaults.
4. Admin updates name/description and submits.
5. TanStack Form validates with Zod `editDepartmentSchema`.
6. `useAdminUpdateDepartment` sends update request with slug + command payload.
7. On success: success toast, departments query invalidation, modal close.
8. On error: API or fallback error toast shown; modal remains open for correction/retry.

## Important Details
- `DepartmentTableRow.id` is a **slug**, not numeric ID (`UseDepartmentsTable` maps `department.slug` to `id`).
- The form uses both `isSubmitting` (TanStack Form) and `isPending` (React Query mutation) to disable the submit button safely.
- `key={department.id}` on content component ensures correct remounting when switching which department is being edited.
- Description is optional in UI and normalized to `null` for backend friendliness.
- The file uses shared shadcn UI primitives (`Dialog`, `Field`, `Input`, `Textarea`, `Button`) for consistency.

## Beginner Programmer Notes
- **TanStack Form** manages input state, validation, and submit lifecycle without manually wiring lots of `useState` handlers.
- **Zod schema** is a runtime validator that also gives TypeScript types (`z.infer`) so form values stay strongly typed.
- **Orval-generated hook** (`useAdminUpdateDepartment`) means API endpoints are typed and reusable; you avoid hand-written fetch logic.
- **Query invalidation** tells React Query to refetch cached department lists so UI reflects backend changes immediately.
