"use server";

import { refresh } from "next/cache";
import * as z from "zod";
import { requireRole } from "@/lib/dal";
import {
  createEmployee,
  softDeleteEmployee,
  updateEmployee,
  type EmployeeInput,
} from "@/lib/employees";
import { EmployeeSchema, type ActionState } from "@/lib/definitions";

function errorCode(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : null;
}

export async function saveEmployee(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("admin", "hr");

  const id = String(formData.get("id") ?? "");
  const parsed = EmployeeSchema.safeParse({
    employeeNo: formData.get("employeeNo"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    birthdate: formData.get("birthdate") ?? "",
    gender: formData.get("gender") ?? "",
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    hireDate: formData.get("hireDate") ?? "",
    status: formData.get("status") ?? "active",
    departmentId: formData.get("departmentId") ?? "",
    positionId: formData.get("positionId") ?? "",
    managerId: formData.get("managerId") ?? "",
    userId: formData.get("userId") ?? "",
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const value = parsed.data;

  const input: EmployeeInput = {
    employeeNo: value.employeeNo,
    firstName: value.firstName,
    lastName: value.lastName,
    birthdate: value.birthdate || null,
    gender: value.gender || null,
    phone: value.phone || null,
    address: value.address || null,
    hireDate: value.hireDate || null,
    status: value.status,
    departmentId: value.departmentId || null,
    positionId: value.positionId || null,
    managerId: value.managerId || null,
    userId: value.userId || null,
  };

  try {
    if (id) {
      await updateEmployee(id, input);
    } else {
      await createEmployee(input);
    }
  } catch (error) {
    console.error("saveEmployee failed:", error);
    return {
      message:
        errorCode(error) === "23505"
          ? "That employee number or linked user account is already in use."
          : "Could not save the employee.",
    };
  }

  refresh();
  return { success: true };
}

export async function deleteEmployee(formData: FormData) {
  await requireRole("admin", "hr");

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  await softDeleteEmployee(id);
  refresh();
}
