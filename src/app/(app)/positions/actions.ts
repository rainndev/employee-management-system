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

export type PositionActionResult = {
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

export async function savePosition(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole("admin", "hr");

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
      const updated = await updatePosition(
        id,
        title,
        description || null,
        user.id
      );

      if (!updated) {
        return { message: "Position not found." };
      }
    } else {
      await createPosition(title, description || null, user.id);
    }
  } catch (error) {
    console.error("savePosition failed:", error);

    if (errorCode(error) === "23505") {
      return {
        errors: {
          title: ["An active position with that title already exists."],
        },
      };
    }

    if (errorCode(error) === "22P02") {
      return { message: "Position not found." };
    }

    return { message: "Could not save the position." };
  }

  refresh();
  return { success: true };
}

export async function deletePosition(
  id: string
): Promise<PositionActionResult> {
  const user = await requireRole("admin", "hr");

  if (!id) {
    return { success: false, message: "Position not found." };
  }

  try {
    const result = await softDeletePosition(id, user.id);

    if (!result.deleted) {
      return { success: false, message: "Position not found." };
    }

    refresh();
    return {
      success: true,
      message:
        result.unassigned > 0
          ? `Position deleted; ${result.unassigned} employee${
              result.unassigned === 1 ? "" : "s"
            } unassigned.`
          : undefined,
    };
  } catch (error) {
    console.error("deletePosition failed:", error);
    return { success: false, message: "Could not delete the position." };
  }
}
