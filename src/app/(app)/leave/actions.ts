"use server";

import { refresh } from "next/cache";
import * as z from "zod";
import { requireRole, requireUser } from "@/lib/dal";
import { canManage } from "@/lib/roles";
import {
  createLeaveRequest,
  deleteLeaveRequest,
  getLeaveRequest,
  getMyEmployeeId,
  setLeaveStatus,
} from "@/lib/leave";
import { LeaveRequestSchema, type ActionState } from "@/lib/definitions";

export async function createLeaveRequestAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  let employeeId = String(formData.get("employeeId") ?? "");

  // Only admin/hr may file on behalf of someone else; everyone else is pinned
  // to their own employee record, whatever the form sends.
  if (!canManage(user.role)) {
    const mine = await getMyEmployeeId(user.id);

    if (!mine) {
      return {
        message:
          "Your account is not linked to an employee record yet. Ask HR to link it.",
      };
    }

    employeeId = mine;
  }

  const parsed = LeaveRequestSchema.safeParse({
    employeeId,
    leaveTypeId: formData.get("leaveTypeId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    days: formData.get("days"),
    reason: formData.get("reason") ?? "",
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  try {
    await createLeaveRequest({
      ...parsed.data,
      reason: parsed.data.reason || null,
    });
  } catch (error) {
    console.error("createLeaveRequest failed:", error);
    return { message: "Could not submit the leave request." };
  }

  refresh();
  return { success: true };
}

export async function decideLeave(formData: FormData) {
  const user = await requireRole("admin", "hr", "manager");

  const id = String(formData.get("id") ?? "");
  const decision = formData.get("decision");

  if (!id || (decision !== "approved" && decision !== "rejected")) {
    return;
  }

  const approverId = await getMyEmployeeId(user.id);
  if (!approverId) {
    return;
  }

  await setLeaveStatus(id, decision, approverId);
  refresh();
}

export async function deleteLeave(formData: FormData) {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  const request = await getLeaveRequest(id);
  if (!request) {
    return;
  }

  const myEmployeeId = await getMyEmployeeId(user.id);
  const isOwner = myEmployeeId !== null && request.employee_id === myEmployeeId;
  const allowed =
    canManage(user.role) || (isOwner && request.status === "pending");

  if (!allowed) {
    return;
  }

  await deleteLeaveRequest(id);
  refresh();
}
