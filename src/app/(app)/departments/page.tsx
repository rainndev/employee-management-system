import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/dal";
import { canManage } from "@/lib/roles";
import { listDepartments } from "@/lib/departments";
import { DepartmentForm } from "./forms";
import { DepartmentsTable } from "./departments-table";

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
        <DepartmentsTable departments={departments} manage={manage} />
      </div>
    </div>
  );
}
