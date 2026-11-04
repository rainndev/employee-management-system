"use server";

import { refresh } from "next/cache";
import * as z from "zod";
import { requireRole } from "@/lib/dal";
import {
  createDepartment,
  softDeleteDepartment,
  updateDepartment,
} from "@/lib/departments";
import { DepartmentSchema, type ActionState } from "@/lib/definitions";

export type DepartmentActionResult = {
  success: boolean;
  message?: string;
};

function errorCode(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : null;
}

export async function saveDepartment(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole("admin", "hr");

  const id = String(formData.get("id") ?? "");
  const parsed = DepartmentSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { name, description } = parsed.data;

  try {
    if (id) {
      const updated = await updateDepartment(
        id,
        name,
        description || null,
        user.id
      );

      if (!updated) {
        return { message: "Department not found." };
      }
    } else {
      await createDepartment(name, description || null, user.id);
    }
  } catch (error) {
    console.error("saveDepartment failed:", error);

    if (errorCode(error) === "23505") {
      return {
        errors: {
          name: ["An active department with that name already exists."],
        },
      };
    }

    if (errorCode(error) === "22P02") {
      return { message: "Department not found." };
    }

    return { message: "Could not save the department." };
  }

  refresh();
  return { success: true };
}

export async function deleteDepartment(
  id: string
): Promise<DepartmentActionResult> {
  const user = await requireRole("admin", "hr");

  if (!id) {
    return { success: false, message: "Department not found." };
  }

  try {
    const result = await softDeleteDepartment(id, user.id);

    if (!result.deleted) {
      return { success: false, message: "Department not found." };
    }

    refresh();
    return {
      success: true,
      message:
        result.unassigned > 0
          ? `Department deleted; ${result.unassigned} employee${
              result.unassigned === 1 ? "" : "s"
            } unassigned.`
          : undefined,
    };
  } catch (error) {
    console.error("deleteDepartment failed:", error);
    return { success: false, message: "Could not delete the department." };
  }
}
