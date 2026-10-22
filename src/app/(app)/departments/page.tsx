import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/dal";
import { canManage } from "@/lib/roles";
import { listDepartments } from "@/lib/departments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DepartmentForm } from "./forms";
import { DepartmentRowActions } from "./row-actions";

export const metadata: Metadata = {
  title: "Departments",
};

export default function DepartmentsPage() {
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
  const user = await requireUser();
  const departments = await listDepartments();
  const manage = canManage(user.role);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {manage
              ? "Create, rename, and remove departments."
              : "Departments in the organisation."}
          </p>
        </div>
        {manage && <DepartmentForm />}
      </div>

      <div className="overflow-hidden rounded-xl border p-4">
        <Table>
          <TableHeader className="[&_th]:text-muted-foreground">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              {manage && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={manage ? 3 : 2}
                  className="text-muted-foreground"
                >
                  No departments yet.
                </TableCell>
              </TableRow>
            )}

            {departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell className="font-medium">{department.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {department.description ?? "—"}
                </TableCell>
                {manage && (
                  <TableCell className="text-right">
                    <DepartmentRowActions department={department} />
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
