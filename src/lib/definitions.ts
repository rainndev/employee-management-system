import * as z from "zod";

export const PasswordSchema = z
  .string()
  .min(8, { error: "Be at least 8 characters long." })
  .regex(/[a-zA-Z]/, { error: "Contain at least one letter." })
  .regex(/[0-9]/, { error: "Contain at least one number." });

export const SignupFormSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: PasswordSchema,
});

export const LoginFormSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z.string().min(1, { error: "Please enter your password." }),
});

export type AuthFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export type ResetPasswordState =
  | {
      errors?: {
        password?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export type ActionState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
      success?: boolean;
    }
  | undefined;

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const optionalDate = z
  .string()
  .trim()
  .regex(/^$|^\d{4}-\d{2}-\d{2}$/, { error: "Use a valid date." });

const optionalUuid = z
  .string()
  .trim()
  .regex(new RegExp(`^$|${UUID_PATTERN.source}$`), {
    error: "Choose a valid option.",
  });

export const DepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Name is required." })
    .max(100, { error: "Keep it under 100 characters." }),
  description: z
    .string()
    .trim()
    .max(500, { error: "Keep it under 500 characters." }),
});

export const PositionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: "Title is required." })
    .max(100, { error: "Keep it under 100 characters." }),
  description: z
    .string()
    .trim()
    .max(500, { error: "Keep it under 500 characters." }),
});

export const EmployeeSchema = z.object({
  employeeNo: z
    .string()
    .trim()
    .min(1, { error: "Employee number is required." })
    .max(50, { error: "Keep it under 50 characters." }),
  firstName: z
    .string()
    .trim()
    .min(1, { error: "First name is required." })
    .max(100, { error: "Keep it under 100 characters." }),
  lastName: z
    .string()
    .trim()
    .min(1, { error: "Last name is required." })
    .max(100, { error: "Keep it under 100 characters." }),
  birthdate: optionalDate,
  gender: z.enum(["", "male", "female", "other"], {
    error: "Choose a gender.",
  }),
  phone: z.string().trim().max(30, { error: "Keep it under 30 characters." }),
  address: z
    .string()
    .trim()
    .max(500, { error: "Keep it under 500 characters." }),
  hireDate: optionalDate,
  status: z.enum(["active", "inactive", "terminated", "on_leave"], {
    error: "Choose a status.",
  }),
  departmentId: optionalUuid,
  positionId: optionalUuid,
  managerId: optionalUuid,
  userId: optionalUuid,
});

export const LeaveRequestSchema = z
  .object({
    employeeId: z
      .string()
      .trim()
      .regex(UUID_PATTERN, { error: "Select an employee." }),
    leaveTypeId: z
      .string()
      .trim()
      .regex(UUID_PATTERN, { error: "Select a leave type." }),
    startDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Start date is required." }),
    endDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "End date is required." }),
    days: z.coerce.number().positive({ error: "Days must be greater than 0." }),
    reason: z
      .string()
      .trim()
      .max(500, { error: "Keep it under 500 characters." }),
  })
  .refine((value) => value.endDate >= value.startDate, {
    error: "End date must be on or after the start date.",
    path: ["endDate"],
  });
