"use server";

import { refresh } from "next/cache";
import * as z from "zod";
import { requireAdmin } from "@/lib/dal";
import {
  createLeaveType,
  softDeleteLeaveType,
  updateLeaveType,
} from "@/lib/leave-types";
import { LeaveTypeSchema, type ActionState } from "@/lib/definitions";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type LeaveTypeActionResult = {
  success: boolean;
  message?: string;
};

export async function saveLeaveType(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (id && !UUID_RE.test(id)) {
    return { message: "Leave type not found." };
  }

  const parsed = LeaveTypeSchema.safeParse({
    name: formData.get("name"),
    defaultDays: formData.get("defaultDays"),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const input = {
    name: parsed.data.name,
    defaultDays: parsed.data.defaultDays,
    isPaid: formData.get("isPaid") === "on",
  };

  try {
    if (id) {
      const updated = await updateLeaveType(id, input, admin.id);

      if (!updated) {
        return { message: "Leave type not found." };
      }
    } else {
      await createLeaveType(input, admin.id);
    }
  } catch (error) {
    console.error("saveLeaveType failed:", error);

    if ((error as { code?: string }).code === "23505") {
      return {
        errors: {
          name: ["An active leave type with that name already exists."],
        },
      };
    }

    return { message: "Could not save the leave type." };
  }

  refresh();
  return { success: true };
}

export async function deleteLeaveType(
  id: string
): Promise<LeaveTypeActionResult> {
  const admin = await requireAdmin();

  if (!id || !UUID_RE.test(id)) {
    return { success: false, message: "Leave type not found." };
  }

  try {
    const deleted = await softDeleteLeaveType(id, admin.id);

    if (!deleted) {
      return { success: false, message: "Leave type not found." };
    }
  } catch (error) {
    console.error("deleteLeaveType failed:", error);
    return { success: false, message: "Could not delete the leave type." };
  }

  refresh();
  return { success: true };
}
