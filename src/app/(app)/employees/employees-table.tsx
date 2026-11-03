"use client";

import { useMemo } from "react";
import type { EmployeeListItem, Option } from "@/lib/employees";
import { StatusBadge } from "@/components/status-badge";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/components/data-table";
import { EmployeeRowActions } from "./row-actions";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On leave" },
  { value: "terminated", label: "Terminated" },
];

function getSearchText(employee: EmployeeListItem) {
  return [
    employee.employeeNo,
    employee.name,
    employee.department,
    employee.position,
    employee.status,
    employee.hireDate,
  ]
    .filter(Boolean)
    .join(" ");
}

export function EmployeesTable({
  employees,
  manage,
  departments,
  positions,
  managers,
  users,
}: {
  employees: EmployeeListItem[];
  manage: boolean;
  departments: Option[];
  positions: Option[];
  managers: Option[];
  users: Option[];
}) {
  const columns = useMemo<DataTableColumn<EmployeeListItem>[]>(() => {
    const result: DataTableColumn<EmployeeListItem>[] = [
      {
        id: "employeeNo",
        accessorFn: (employee) => employee.employeeNo,
        header: "No.",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.employeeNo}
          </span>
        ),
      },
      {
        id: "name",
        accessorFn: (employee) => employee.name,
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "department",
        accessorFn: (employee) => employee.department ?? "",
        header: "Department",
        cell: ({ row }) => row.original.department ?? "—",
      },
      {
        id: "position",
        accessorFn: (employee) => employee.position ?? "",
        header: "Position",
        cell: ({ row }) => row.original.position ?? "—",
      },
      {
        id: "status",
        accessorFn: (employee) => employee.status,
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "hireDate",
        accessorFn: (employee) => employee.hireDate,
        header: "Hire date",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.hireDate || "—"}
          </span>
        ),
      },
    ];

    if (manage) {
      result.push({
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const employee = row.original;
          const rowUsers =
            employee.userId && employee.userEmail
              ? [...users, { id: employee.userId, label: employee.userEmail }]
              : users;
          const rowManagers = managers.filter(
            (manager) => manager.id !== employee.id
          );

          return (
            <div className="text-right">
              <EmployeeRowActions
                employee={employee}
                departments={departments}
                positions={positions}
                managers={rowManagers}
                users={rowUsers}
              />
            </div>
          );
        },
      });
    }

    return result;
  }, [manage, departments, positions, managers, users]);

  const filters = useMemo<DataTableFilter<EmployeeListItem>[]>(
    () => [
      {
        id: "department",
        allLabel: "All departments",
        options: departments.map((department) => ({
          value: department.label,
          label: department.label,
        })),
        getValue: (employee) => employee.department ?? "",
      },
      {
        id: "position",
        allLabel: "All positions",
        options: positions.map((position) => ({
          value: position.label,
          label: position.label,
        })),
        getValue: (employee) => employee.position ?? "",
      },
      {
        id: "status",
        allLabel: "All statuses",
        options: STATUS_OPTIONS,
        getValue: (employee) => employee.status,
      },
    ],
    [departments, positions]
  );

  return (
    <DataTable
      data={employees}
      columns={columns}
      filters={filters}
      getSearchText={getSearchText}
      searchPlaceholder="Search name, number, department..."
      emptyMessage="No employees match your search."
    />
  );
}
