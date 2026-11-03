import type { Metadata } from "next";
import { Suspense } from "react";
import { requireRole } from "@/lib/dal";
import { canManage } from "@/lib/roles";
import {
  listEmployees,
  listManagerOptions,
  listUserOptions,
} from "@/lib/employees";
import { listDepartments } from "@/lib/departments";
import { listPositions } from "@/lib/positions";
import { EmployeeForm } from "./forms";
import { EmployeesTable } from "./employees-table";

export const metadata: Metadata = {
  title: "Employees",
};

export default function EmployeesPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
      >
        <Content />
      </Suspense>
    </main>
  );
}

async function Content() {
  const user = await requireRole("admin", "hr", "manager");
  const manage = canManage(user.role);

  const [employees, departments, positions, managers, users] =
    await Promise.all([
      listEmployees(),
      manage ? listDepartments() : Promise.resolve([]),
      manage ? listPositions() : Promise.resolve([]),
      manage ? listManagerOptions() : Promise.resolve([]),
      manage ? listUserOptions() : Promise.resolve([]),
    ]);

  const departmentOptions = departments.map((d) => ({
    id: d.id,
    label: d.name,
  }));
  const positionOptions = positions.map((p) => ({
    id: p.id,
    label: p.title,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {manage
              ? "Add, edit, and remove employee records."
              : "Directory of employee records."}
          </p>
        </div>
        {manage && (
          <EmployeeForm
            departments={departmentOptions}
            positions={positionOptions}
            managers={managers}
            users={users}
          />
        )}
      </div>

      <div className="overflow-hidden rounded-xl border p-4">
        <EmployeesTable
          employees={employees}
          manage={manage}
          departments={departmentOptions}
          positions={positionOptions}
          managers={managers}
          users={users}
        />
      </div>
    </div>
  );
}
