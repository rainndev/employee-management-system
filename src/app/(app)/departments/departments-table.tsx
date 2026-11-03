"use client";

import { useMemo } from "react";
import type { Department } from "@/lib/departments";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DepartmentRowActions } from "./row-actions";

function getSearchText(department: Department) {
  return [department.name, department.description].filter(Boolean).join(" ");
}

export function DepartmentsTable({
  departments,
  manage,
}: {
  departments: Department[];
  manage: boolean;
}) {
  const columns = useMemo<DataTableColumn<Department>[]>(() => {
    const result: DataTableColumn<Department>[] = [
      {
        id: "name",
        accessorFn: (department) => department.name,
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "description",
        accessorFn: (department) => department.description ?? "",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.description ?? "—"}
          </span>
        ),
      },
    ];

    if (manage) {
      result.push({
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-right">
            <DepartmentRowActions department={row.original} />
          </div>
        ),
      });
    }

    return result;
  }, [manage]);

  return (
    <DataTable
      data={departments}
      columns={columns}
      getSearchText={getSearchText}
      searchPlaceholder="Search departments..."
      emptyMessage="No departments match your search."
    />
  );
}
