import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/dal";
import { canApprove, canManage } from "@/lib/roles";
import {
  getMyEmployeeId,
  listLeaveRequests,
  listLeaveTypes,
} from "@/lib/leave";
import { listEmployeeOptions } from "@/lib/employees";
import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeaveRequestForm } from "./forms";
import { LeaveRowActions } from "./row-actions";
import { DateRange } from "@/components/date-range";

export const metadata: Metadata = {
  title: "Leave",
};

function statusVariant(status: string) {
  if (status === "approved") {
    return "default" as const;
  }
  if (status === "rejected") {
    return "destructive" as const;
  }
  return "secondary" as const;
}

export default function LeavePage() {
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
  const approveAll = canApprove(user.role);
  const manage = canManage(user.role);

  const myEmployeeId = await getMyEmployeeId(user.id);

  const [leaveTypes, requests, employees] = await Promise.all([
    listLeaveTypes(),
    approveAll
      ? listLeaveRequests()
      : myEmployeeId
        ? listLeaveRequests(myEmployeeId)
        : Promise.resolve([]),
    manage ? listEmployeeOptions() : Promise.resolve([]),
  ]);

  const canFileOwn = manage || myEmployeeId !== null;
  const canDecide = approveAll && myEmployeeId !== null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Leave requests
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {manage
              ? "File requests for anyone and approve or reject pending ones."
              : approveAll
                ? "Pending requests you can approve or reject."
                : "Your own leave requests."}
          </p>
        </div>
        {canFileOwn && (
          <LeaveRequestForm
            leaveTypes={leaveTypes}
            employees={manage ? employees : undefined}
          />
        )}
      </div>

      {approveAll && !myEmployeeId && (
        <Alert>
          <AlertCircleIcon />
          <AlertDescription>
            Your account is not linked to an employee record, so you cannot
            approve or reject requests. Ask an admin to link you to an employee.
          </AlertDescription>
        </Alert>
      )}

      {!canFileOwn && (
        <Alert>
          <AlertCircleIcon />
          <AlertDescription>
            Your account is not linked to an employee record yet, so you cannot
            file a leave request. Ask HR to link your account.
          </AlertDescription>
        </Alert>
      )}

      <div className="overflow-hidden rounded-xl border p-4">
        <Table>
          <TableHeader className="[&_th]:text-muted-foreground">
            <TableRow>
              {approveAll && <TableHead>Employee</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approver</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={approveAll ? 7 : 6}
                  className="text-muted-foreground"
                >
                  No leave requests yet.
                </TableCell>
              </TableRow>
            )}

            {requests.map((request) => {
              const canDelete =
                manage ||
                (myEmployeeId !== null &&
                  request.employeeId === myEmployeeId &&
                  request.status === "pending");

              return (
                <TableRow key={request.id}>
                  {approveAll && (
                    <TableCell>
                      <div className="font-medium">{request.employeeName}</div>
                      <div className="text-xs text-muted-foreground">
                        {request.employeeNo}
                      </div>
                    </TableCell>
                  )}
                  <TableCell>{request.leaveType}</TableCell>
                  <TableCell>
                    <DateRange
                      start={request.startDate}
                      end={request.endDate}
                    />
                  </TableCell>
                  <TableCell>{request.days}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(request.status)}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {request.approverName ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <LeaveRowActions
                      request={request}
                      canDecide={canDecide}
                      canDelete={canDelete}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
