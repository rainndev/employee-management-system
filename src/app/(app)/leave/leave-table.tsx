"use client";

import { useMemo } from "react";
import type { LeaveRequestItem } from "@/lib/leave";
import { DateRange } from "@/components/date-range";
import { StatusBadge } from "@/components/status-badge";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/components/data-table";
import { LeaveDetailsDialog } from "./details-dialog";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

function getSearchText(request: LeaveRequestItem) {
  return [
    request.employeeName,
    request.employeeNo,
    request.leaveType,
    request.startDate,
    request.endDate,
    request.status,
    request.approverName,
    request.reason,
    request.remark,
  ]
    .filter(Boolean)
    .join(" ");
}

export function LeaveTable({
  requests,
  approveAll,
  manage,
  myEmployeeId,
  leaveTypes,
}: {
  requests: LeaveRequestItem[];
  approveAll: boolean;
  manage: boolean;
  myEmployeeId: string | null;
  leaveTypes: string[];
}) {
  const columns = useMemo<DataTableColumn<LeaveRequestItem>[]>(() => {
    const result: DataTableColumn<LeaveRequestItem>[] = [];

    if (approveAll) {
      result.push({
        id: "employee",
        accessorFn: (request) => request.employeeName,
        header: "Employee",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.employeeName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.employeeNo}
            </div>
          </div>
        ),
      });
    }

    result.push(
      {
        id: "leaveType",
        accessorFn: (request) => request.leaveType,
        header: "Type",
        cell: ({ row }) => row.original.leaveType,
      },
      {
        id: "dates",
        accessorFn: (request) => request.startDate,
        header: "Dates",
        cell: ({ row }) => (
          <DateRange
            start={row.original.startDate}
            end={row.original.endDate}
          />
        ),
      },
      {
        id: "days",
        accessorFn: (request) => request.days,
        header: "Days",
        cell: ({ row }) => row.original.days,
      },
      {
        id: "status",
        accessorFn: (request) => request.status,
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "approver",
        accessorFn: (request) => request.approverName ?? "",
        header: "Approver",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.approverName ?? "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const request = row.original;
          const isOwn =
            myEmployeeId !== null && request.employeeId === myEmployeeId;
          const canDecide =
            approveAll &&
            myEmployeeId !== null &&
            !isOwn &&
            (manage || request.managerId === myEmployeeId);
          const canCancel = manage
            ? request.status === "pending" || request.status === "approved"
            : isOwn && request.status === "pending";

          return (
            <div className="text-right">
              <LeaveDetailsDialog
                request={request}
                canDecide={canDecide}
                canCancel={canCancel}
              />
            </div>
          );
        },
      }
    );

    return result;
  }, [approveAll, manage, myEmployeeId]);

  const filters = useMemo<DataTableFilter<LeaveRequestItem>[]>(
    () => [
      {
        id: "status",
        allLabel: "All statuses",
        options: STATUS_OPTIONS,
        getValue: (request) => request.status,
      },
      {
        id: "leaveType",
        allLabel: "All leave types",
        options: leaveTypes.map((name) => ({ value: name, label: name })),
        getValue: (request) => request.leaveType,
      },
    ],
    [leaveTypes]
  );

  return (
    <DataTable
      data={requests}
      columns={columns}
      filters={filters}
      getSearchText={getSearchText}
      searchPlaceholder="Search employee, type, status..."
      emptyMessage="No leave requests match your search."
    />
  );
}
