import { requireAdmin } from "@/lib/session";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="flex min-h-full flex-1">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-auto p-4 pb-10 md:p-8">{children}</main>
    </div>
  );
}
