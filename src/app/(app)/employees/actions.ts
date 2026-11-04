"use server";

import { refresh } from "next/cache";
import * as z from "zod";
import { requireRole } from "@/lib/dal";
import {
  createEmployee,
  EmployeeNotFoundError,
  EmployeeValidationError,
  getEmployeeAssignments,
  LastActiveAdminError,
  softDeleteEmployee,
  updateEmployee,
  validateEmployeeReferences,
  type EmployeeInput,
} from "@/lib/employees";
import { EmployeeSchema, type ActionState } from "@/lib/definitions";
import { optionalString } from "@/lib/constants";

export type EmployeeActionResult = {
  success: boolean;
  message?: string;
};

function errorString(error: unknown, key: "code" | "constraint") {
  return typeof error === "object" &&
    error !== null &&
    key in error &&
    typeof (error as Record<string, unknown>)[key] === "string"
    ? ((error as Record<string, unknown>)[key] as string)
    : null;
}

function uuidPattern() {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
}

export async function saveEmployee(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireRole("admin", "hr");

  const id = String(formData.get("id") ?? "");
  const parsed = EmployeeSchema.safeParse({
    employeeNo: formData.get("employeeNo"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    birthdate: formData.get("birthdate") ?? "",
    gender: optionalString(formData.get("gender")),
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    hireDate: formData.get("hireDate") ?? "",
    status: formData.get("status") ?? "active",
    departmentId: optionalString(formData.get("departmentId")),
    positionId: optionalString(formData.get("positionId")),
    managerId: optionalString(formData.get("managerId")),
    userId: optionalString(formData.get("userId")),
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  if (id && !uuidPattern().test(id)) {
    return { message: "Employee not found." };
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
      const current = await getEmployeeAssignments(id);

      if (!current) {
        return { message: "Employee not found." };
      }

      await validateEmployeeReferences(input, {
        id: current.id,
        managerId: current.manager_id,
        userId: current.user_id,
        departmentId: current.department_id,
        positionId: current.position_id,
      });
      await updateEmployee(id, input, user.id);
    } else {
      await validateEmployeeReferences(input);
      await createEmployee(input, user.id);
    }
  } catch (error) {
    if (error instanceof EmployeeValidationError) {
      return { errors: { [error.field]: [error.message] } };
    }

    if (error instanceof EmployeeNotFoundError) {
      return { message: error.message };
    }

    if (error instanceof LastActiveAdminError) {
      return { message: error.message };
    }

    console.error("saveEmployee failed:", error);

    if (errorString(error, "code") === "23505") {
      const constraint = errorString(error, "constraint") ?? "";

      if (constraint.includes("employee_no")) {
        return {
          errors: {
            employeeNo: ["That employee number is already in use."],
          },
        };
      }

      if (constraint.includes("user_id")) {
        return {
          errors: {
            userId: [
              "That user account is already linked to another employee.",
            ],
          },
        };
      }

      return {
        message:
          "That employee number or linked user account is already in use.",
      };
    }

    if (errorString(error, "code") === "23514") {
      return { message: "One of the selected values is not valid." };
    }

    if (errorString(error, "code") === "23503") {
      return {
        message: "A referenced department, position, or user no longer exists.",
      };
    }

    return { message: "Could not save the employee." };
  }

  refresh();
  return { success: true };
}

export async function deleteEmployee(
  id: string
): Promise<EmployeeActionResult> {
  const user = await requireRole("admin", "hr");

  if (!id || !uuidPattern().test(id)) {
    return { success: false, message: "Employee not found." };
  }

  try {
    const deleted = await softDeleteEmployee(id, user.id);

    if (!deleted) {
      return { success: false, message: "Employee not found." };
    }
  } catch (error) {
    if (error instanceof LastActiveAdminError) {
      return { success: false, message: error.message };
    }

    console.error("deleteEmployee failed:", error);
    return { success: false, message: "Could not delete the employee." };
  }

  refresh();
  return { success: true };
}
