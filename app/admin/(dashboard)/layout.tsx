import { requireAdmin } from "@/lib/session";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="flex min-h-full flex-1">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-auto p-2 pb-8 md:p-4">
        <div className="fc-workspace-shell min-h-full overflow-hidden">
          <AppHeader />
          <div className="fc-shell-main">{children}</div>
        </div>
      </main>
    </div>
  );
}
