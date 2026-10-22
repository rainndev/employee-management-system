import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { canManage } from "@/lib/roles";
import {
  listEmployees,
  listManagerOptions,
  listUserOptions,
} from "@/lib/employees";
import { listDepartments } from "@/lib/departments";
import { listPositions } from "@/lib/positions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteEmployee } from "./actions";
import { EmployeeForm } from "./forms";

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
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {manage
            ? "Add, edit, and remove employee records."
            : "Directory of employee records."}
        </p>
      </div>

      {manage && (
        <Card>
          <CardContent>
            <details>
              <summary className="cursor-pointer text-sm font-medium">
                Add employee
              </summary>
              <div className="mt-4">
                <EmployeeForm
                  departments={departments.map((d) => ({
                    id: d.id,
                    label: d.name,
                  }))}
                  positions={positions.map((p) => ({
                    id: p.id,
                    label: p.title,
                  }))}
                  managers={managers}
                  users={users}
                />
              </div>
            </details>
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Hire date</TableHead>
              {manage && <TableHead>Actions</TableHead>}
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

            {employees.map((employee) => (
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
                  {employee.hireDate ?? "—"}
                </TableCell>
                {manage && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/employees/${employee.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                      <form action={deleteEmployee}>
                        <input type="hidden" name="id" value={employee.id} />
                        <Button type="submit" variant="destructive" size="sm">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
