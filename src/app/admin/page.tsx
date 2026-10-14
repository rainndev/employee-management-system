import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getAdminStats, listUsers } from "@/lib/admin";
import { requireAdmin } from "@/lib/dal";
import { UsersTable } from "./users-table";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading...</p>}>
        <AdminContent />
      </Suspense>
    </main>
  );
}

async function AdminContent() {
  const admin = await requireAdmin();
  const [stats, users] = await Promise.all([getAdminStats(), listUsers()]);

  const cards = [
    { label: "Employees", value: stats.employees },
    { label: "Departments", value: stats.departments },
    { label: "Positions", value: stats.positions },
    { label: "Users", value: stats.users },
    { label: "Pending leave", value: stats.pendingLeaveRequests },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as {admin.email}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium whitespace-nowrap underline"
        >
          Back to dashboard
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-black/10 p-4 dark:border-white/15"
          >
            <p className="text-xs text-zinc-500">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Admins can change roles and disable accounts. You cannot edit your
            own row.
          </p>
        </div>
        <UsersTable users={users} currentUserId={admin.id} />
      </section>
    </div>
  );
}
