"use server";

import { refresh } from "next/cache";
import * as z from "zod";
import { requireRole } from "@/lib/dal";
import {
  createPosition,
  softDeletePosition,
  updatePosition,
} from "@/lib/positions";
import { PositionSchema, type ActionState } from "@/lib/definitions";

export async function savePosition(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("admin", "hr");

  const id = String(formData.get("id") ?? "");
  const parsed = PositionSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const { title, description } = parsed.data;

  try {
    if (id) {
      await updatePosition(id, title, description || null);
    } else {
      await createPosition(title, description || null);
    }
  } catch (error) {
    console.error("savePosition failed:", error);
    return { message: "Could not save. That title may already be in use." };
  }

  refresh();
  return { success: true };
}

export async function deletePosition(formData: FormData) {
  await requireRole("admin", "hr");

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  await softDeletePosition(id);
  refresh();
}
