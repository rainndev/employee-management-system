import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getAdminStats, listUsers } from "@/lib/admin";
import { listAdminLeaveTypes } from "@/lib/leave-types";
import { requireAdmin } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsersTable } from "./users-table";
import { LeaveTypesManager } from "./leave-types-manager";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
      >
        <AdminContent />
      </Suspense>
    </main>
  );
}

async function AdminContent() {
  const admin = await requireAdmin();
  const [stats, users, leaveTypes] = await Promise.all([
    getAdminStats(),
    listUsers(),
    listAdminLeaveTypes(),
  ]);

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
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {admin.email}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label} size="sm">
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl">{card.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">
            Admins can change roles, disable accounts, and set a new password
            for a user. Share a reset password with the user directly. You
            cannot edit your own row; use Account to change your own password.
          </p>
        </div>
        <UsersTable users={users} currentUserId={admin.id} />
      </section>

      <section className="flex flex-col gap-3">
        <LeaveTypesManager leaveTypes={leaveTypes} />
      </section>
    </div>
  );
}
