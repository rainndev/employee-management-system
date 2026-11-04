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
  hasOverlappingLeaveRequest,
  InsufficientLeaveBalanceError,
  setLeaveStatus,
} from "@/lib/leave";
import { LeaveRequestSchema, type ActionState } from "@/lib/definitions";
import { countLeaveDays } from "@/lib/leave-days";

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

  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  // Days are derived from the selected range; never trust a posted count.
  const parsed = LeaveRequestSchema.safeParse({
    employeeId,
    leaveTypeId: formData.get("leaveTypeId"),
    startDate,
    endDate,
    days: countLeaveDays(startDate, endDate),
    reason: formData.get("reason") ?? "",
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const overlapMessage =
    "This employee already has a pending or approved leave request that overlaps those dates.";

  if (
    await hasOverlappingLeaveRequest(
      parsed.data.employeeId,
      parsed.data.startDate,
      parsed.data.endDate
    )
  ) {
    return { errors: { startDate: [overlapMessage] } };
  }

  try {
    await createLeaveRequest({
      ...parsed.data,
      reason: parsed.data.reason || null,
    });
  } catch (error) {
    if (error instanceof InsufficientLeaveBalanceError) {
      return { message: error.message };
    }

    // 23P01 = exclusion_violation from leave_request_no_overlap.
    if ((error as { code?: string }).code === "23P01") {
      return { errors: { startDate: [overlapMessage] } };
    }

    console.error("createLeaveRequest failed:", error);
    return { message: "Could not submit the leave request." };
  }

  refresh();
  return { success: true };
}

export type LeaveActionResult = { success: boolean; message?: string };

export async function decideLeave(
  id: string,
  decision: "approved" | "rejected"
): Promise<LeaveActionResult> {
  const user = await requireRole("admin", "hr", "manager");

  if (!id) {
    return { success: false, message: "Missing leave request." };
  }

  const approverId = await getMyEmployeeId(user.id);
  if (!approverId) {
    return {
      success: false,
      message: "Your account is not linked to an employee record.",
    };
  }

  try {
    await setLeaveStatus(id, decision, approverId);
  } catch (error) {
    if (error instanceof InsufficientLeaveBalanceError) {
      return { success: false, message: error.message };
    }

    console.error("setLeaveStatus failed:", error);
    return { success: false, message: "Could not update the request." };
  }

  refresh();
  return { success: true };
}

export async function deleteLeave(id: string): Promise<LeaveActionResult> {
  const user = await requireUser();

  if (!id) {
    return { success: false, message: "Missing leave request." };
  }

  const request = await getLeaveRequest(id);
  if (!request) {
    return { success: false, message: "Leave request not found." };
  }

  const myEmployeeId = await getMyEmployeeId(user.id);
  const isOwner = myEmployeeId !== null && request.employee_id === myEmployeeId;
  const allowed =
    canManage(user.role) || (isOwner && request.status === "pending");

  if (!allowed) {
    return { success: false, message: "You cannot delete this request." };
  }

  try {
    await deleteLeaveRequest(id);
  } catch (error) {
    console.error("deleteLeaveRequest failed:", error);
    return { success: false, message: "Could not delete the request." };
  }

  refresh();
  return { success: true };
}
