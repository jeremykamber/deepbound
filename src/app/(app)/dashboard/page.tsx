export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personas and analyze their feedback.
        </p>
      </div>
      <div className="rounded-xl border bg-card text-card-foreground p-8">
        <p className="text-sm text-muted-foreground">Dashboard content will go here.</p>
      </div>
    </div>
  );
}
