import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import {
  getEmployee,
  listManagerOptions,
  listUserOptions,
} from "@/lib/employees";
import { listDepartments } from "@/lib/departments";
import { listPositions } from "@/lib/positions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeForm } from "../../forms";

export const metadata: Metadata = {
  title: "Edit employee",
};

export default function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl p-4 lg:p-6">
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
      >
        <Content params={params} />
      </Suspense>
    </main>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin", "hr");

  const { id } = await params;
  const employee = await getEmployee(id);

  if (!employee) {
    notFound();
  }

  const [departments, positions, managers, users] = await Promise.all([
    listDepartments(),
    listPositions(),
    listManagerOptions(employee.id),
    listUserOptions(employee.userId || undefined),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="link" className="h-auto p-0">
          <Link href="/employees">← Back to employees</Link>
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit employee
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {employee.firstName} {employee.lastName} · {employee.employeeNo}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee details</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm
            employee={employee}
            departments={departments.map((d) => ({ id: d.id, label: d.name }))}
            positions={positions.map((p) => ({ id: p.id, label: p.title }))}
            managers={managers}
            users={users}
          />
        </CardContent>
      </Card>
    </div>
  );
}
