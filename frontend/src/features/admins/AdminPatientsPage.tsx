// Displays the admin patient management page with a header and patient records table.
export function AdminPatientsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="space-y-1">
          <h1 className="font-semibold text-3xl tracking-tight">Manage Patients</h1>
          <p className="text-lg text-muted-foreground">
            View, update, and manage registered patient records across the platform.
          </p>
        </div>
      </header>
    </div>
  );
}
