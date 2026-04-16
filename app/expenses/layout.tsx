import { requireAuth } from "@/lib/session";
import { ExpensesTopNav } from "@/components/expenses-top-nav";

export default async function ExpensesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAuth();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <ExpensesTopNav isAdmin={user.role === "ADMIN"} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-10 pt-2 md:px-6">{children}</main>
    </div>
  );
}
