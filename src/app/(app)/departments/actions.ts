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

export async function saveDepartment(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("admin", "hr");

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
      await updateDepartment(id, name, description || null);
    } else {
      await createDepartment(name, description || null);
    }
  } catch (error) {
    console.error("saveDepartment failed:", error);
    return { message: "Could not save. That name may already be in use." };
  }

  refresh();
  return { success: true };
}

export async function deleteDepartment(id: string) {
  await requireRole("admin", "hr");

  if (!id) {
    return;
  }

  await softDeleteDepartment(id);
  refresh();
}
