import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/dal";
import { canManage } from "@/lib/roles";
import { listDepartments } from "@/lib/departments";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteDepartment } from "./actions";
import { DepartmentForm } from "./forms";

export const metadata: Metadata = {
  title: "Departments",
};

export default function DepartmentsPage() {
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
  const user = await requireUser();
  const departments = await listDepartments();
  const manage = canManage(user.role);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {manage
            ? "Create, rename, and remove departments."
            : "Departments in the organisation."}
        </p>
      </div>

      {manage && (
        <Card>
          <CardHeader>
            <CardTitle>Add department</CardTitle>
            <CardDescription>
              Names must be unique among active departments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DepartmentForm />
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              {manage && <TableHead>Actions</TableHead>}
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
                  <TableCell>
                    <div className="flex flex-col items-start gap-2">
                      <details className="w-full">
                        <summary className="cursor-pointer text-sm underline">
                          Edit
                        </summary>
                        <div className="mt-3 w-72 rounded-lg border bg-muted/40 p-3">
                          <DepartmentForm department={department} />
                        </div>
                      </details>

                      <form action={deleteDepartment}>
                        <input type="hidden" name="id" value={department.id} />
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
