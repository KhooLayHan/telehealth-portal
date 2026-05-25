# Add New Department Form (Plain-English Explanation)

## Short Version
This component shows a pop-up form that lets an admin create a new department. It validates the input before sending anything to the backend, calls the generated API mutation to create the department, refreshes the department list, and closes the dialog when successful. If something fails, it shows a friendly error toast.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDepartments/AddNewDepartmentForm.tsx` | Main UI component, form validation, submit logic, API call, and success/error handling for adding a department. |

## What Happens
1. The dialog receives `open` and `onOpenChange` from its parent page, so the parent controls when it appears.
2. The form starts with empty `name` and `description`.
3. Validation rules are defined with Zod:
   - `name` is required and max 100 chars.
   - `description` is optional but max 500 chars.
4. When submitted, the form trims spaces, converts an empty description to `null`, and sends data using `useAdminCreateDepartment` (generated API hook).
5. On success:
   - shows success toast,
   - invalidates/refetches the "get all departments" query,
   - closes the dialog,
   - resets the form.
6. On error:
   - if backend returned structured API error, it displays that title,
   - otherwise it shows a generic failure message.
7. If the user cancels/closes the dialog, the form resets so stale input does not remain.

## Important Code Snippets
From `frontend/src/features/admins/manageDepartments/AddNewDepartmentForm.tsx`:

```tsx
const addDepartmentSchema = z.object({
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
This is the pre-submit safety check. It ensures users cannot submit a blank department name and prevents overly long input.

From `frontend/src/features/admins/manageDepartments/AddNewDepartmentForm.tsx`:

```tsx
const { mutateAsync, isPending } = useAdminCreateDepartment({
  mutation: {
    onSuccess: async () => {
      toast.success("Department created successfully");
      await queryClient.invalidateQueries({ queryKey: getAdminGetAllDepartmentsQueryKey() });
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.data.title ?? "Failed to create department");
        return;
      }

      toast.error("Failed to create department");
    },
  },
});
```
This block handles backend communication outcomes. Success refreshes the department list and closes the dialog; failure gives user feedback.

From `frontend/src/features/admins/manageDepartments/AddNewDepartmentForm.tsx`:

```tsx
onSubmit: async ({ value }) => {
  const description = value.description.trim();

  await mutateAsync({
    data: {
      name: value.name.trim(),
      description: description.length > 0 ? description : null,
    },
  });
  form.reset();
},
```
This is the actual submit path. It normalizes input and sends clean payload values to the API.

## Code Flow
1. Admin clicks "Add New Department" on the parent screen.
2. Parent opens this dialog component.
3. Admin types name/description; form tracks touched state and validity.
4. Admin clicks "Create Department".
5. Validation runs via Zod + TanStack Form.
6. If valid, mutation sends request to backend.
7. If request succeeds, list cache is invalidated and dialog closes.
8. If request fails, an error toast appears and dialog stays open.

## Important Details
- The submit button is disabled while submitting (`isSubmitting || isPending`) to avoid duplicate submissions.
- Description is optional by behavior: empty or whitespace-only values become `null`.
- The helper `toFieldErrors` converts TanStack validation error objects into the shape expected by the UI `FieldError` component.
- Character counters and max lengths are shown in the UI, helping users stay within constraints before submit.

## In Everyday Words
This is a guided pop-up form for admins to add a department safely. It checks inputs early, sends clean data, updates the list right away after success, and clearly tells the user what happened.
