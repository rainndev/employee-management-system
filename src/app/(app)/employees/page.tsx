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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmployeeForm } from "./forms";
import { EmployeeRowActions } from "./row-actions";

export const metadata: Metadata = {
  title: "Employees",
};

function statusVariant(status: string) {
  if (status === "active") {
    return "default" as const;
  }
  if (status === "on_leave") {
    return "secondary" as const;
  }
  if (status === "terminated") {
    return "destructive" as const;
  }
  return "outline" as const;
}

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

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="[&_th]:text-muted-foreground">
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Hire date</TableHead>
              {manage && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={manage ? 7 : 6}
                  className="text-muted-foreground"
                >
                  No employees yet.
                </TableCell>
              </TableRow>
            )}

            {employees.map((employee) => {
              const rowUsers =
                employee.userId && employee.userEmail
                  ? [
                      ...users,
                      { id: employee.userId, label: employee.userEmail },
                    ]
                  : users;
              const rowManagers = managers.filter(
                (manager) => manager.id !== employee.id
              );

              return (
                <TableRow key={employee.id}>
                  <TableCell className="text-muted-foreground">
                    {employee.employeeNo}
                  </TableCell>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.department ?? "—"}</TableCell>
                  <TableCell>{employee.position ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(employee.status)}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.hireDate || "—"}
                  </TableCell>
                  {manage && (
                    <TableCell className="text-right">
                      <EmployeeRowActions
                        employee={employee}
                        departments={departmentOptions}
                        positions={positionOptions}
                        managers={rowManagers}
                        users={rowUsers}
                      />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
