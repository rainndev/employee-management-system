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
import { LeaveRequestForm } from "./forms";
import { LeaveTable } from "./leave-table";

export const metadata: Metadata = {
  title: "Leave",
};

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
        <LeaveTable
          requests={requests}
          approveAll={approveAll}
          manage={manage}
          myEmployeeId={myEmployeeId}
          leaveTypes={leaveTypes.map((type) => type.name)}
        />
      </div>
    </div>
  );
}
