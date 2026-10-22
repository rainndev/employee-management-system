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
import { decideLeave, deleteLeave } from "./actions";
import { LeaveRequestForm } from "./forms";

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

      {approveAll && !myEmployeeId && (
        <Alert>
          <AlertCircleIcon />
          <AlertDescription>
            Your account is not linked to an employee record, so you cannot
            approve or reject requests. Ask an admin to link you to an employee.
          </AlertDescription>
        </Alert>
      )}

      {canFileOwn ? (
        <Card>
          <CardContent>
            <details>
              <summary className="cursor-pointer text-sm font-medium">
                New leave request
              </summary>
              <div className="mt-4">
                <LeaveRequestForm
                  leaveTypes={leaveTypes}
                  employees={manage ? employees : undefined}
                />
              </div>
            </details>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertCircleIcon />
          <AlertDescription>
            Your account is not linked to an employee record yet, so you cannot
            file a leave request. Ask HR to link your account.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              {approveAll && <TableHead>Employee</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approver</TableHead>
              <TableHead>Actions</TableHead>
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
                  <TableCell className="whitespace-nowrap">
                    {request.startDate} → {request.endDate}
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
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      {canDecide && request.status === "pending" && (
                        <>
                          <form action={decideLeave}>
                            <input type="hidden" name="id" value={request.id} />
                            <input
                              type="hidden"
                              name="decision"
                              value="approved"
                            />
                            <Button type="submit" size="sm">
                              Approve
                            </Button>
                          </form>
                          <form action={decideLeave}>
                            <input type="hidden" name="id" value={request.id} />
                            <input
                              type="hidden"
                              name="decision"
                              value="rejected"
                            />
                            <Button type="submit" variant="outline" size="sm">
                              Reject
                            </Button>
                          </form>
                        </>
                      )}

                      {canDelete && (
                        <form action={deleteLeave}>
                          <input type="hidden" name="id" value={request.id} />
                          <Button type="submit" variant="destructive" size="sm">
                            Delete
                          </Button>
                        </form>
                      )}
                    </div>
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
