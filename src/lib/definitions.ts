import * as z from "zod";

// The database runs in Asia/Kuala_Lumpur. Decide "today" there rather than by
// the browser/server clock, which can still be on yesterday in UTC between
// 00:00 and 08:00 local time.
export const COMPANY_TIME_ZONE = "Asia/Kuala_Lumpur";

export function todayInCompanyTimeZone(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: COMPANY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

export const PasswordSchema = z
  .string()
  .min(8, { error: "Be at least 8 characters long." })
  .max(72, { error: "Keep it under 72 characters." })
  .regex(/[a-zA-Z]/, { error: "Contain at least one letter." })
  .regex(/[0-9]/, { error: "Contain at least one number." });

// Normalise before validating so "  User@Example.com " becomes
// "user@example.com" and duplicate accounts cannot differ only by case.
export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Please enter a valid email." }));

export const SignupFormSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export const LoginFormSchema = z.object({
  email: EmailSchema,
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

export type AccountPasswordState =
  | {
      errors?: {
        currentPassword?: string[];
        password?: string[];
        confirmPassword?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export type ProfileState =
  | {
      errors?: {
        email?: string[];
        currentPassword?: string[];
        firstName?: string[];
        lastName?: string[];
        phone?: string[];
        address?: string[];
        birthdate?: string[];
        gender?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function isRealDate(value: string) {
  return z.iso.date().safeParse(value).success;
}

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || isRealDate(value), {
    error: "Use a valid date.",
  });

const requiredDate = (message: string) =>
  z.string().trim().refine(isRealDate, { error: message });

const optionalUuid = z
  .string()
  .trim()
  .regex(new RegExp(`^$|${UUID_PATTERN.source}$`), {
    error: "Choose a valid option.",
  });

const todayISO = todayInCompanyTimeZone();

export const AccountProfileSchema = z.object({
  email: EmailSchema,
  currentPassword: z.string().optional(),
});

export const ProfileEmployeeSchema = z
  .object({
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
    phone: z.string().trim().max(30, { error: "Keep it under 30 characters." }),
    address: z
      .string()
      .trim()
      .max(500, { error: "Keep it under 500 characters." }),
    birthdate: optionalDate,
    gender: z.enum(["", "male", "female", "other"], {
      error: "Choose a gender.",
    }),
  })
  .refine((value) => !value.birthdate || value.birthdate <= todayISO, {
    error: "Birthdate cannot be in the future.",
    path: ["birthdate"],
  });

export const LeaveTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Name is required." })
    .max(50, { error: "Keep it under 50 characters." }),
  defaultDays: z
    .string()
    .trim()
    .min(1, { error: "Default days is required." })
    .refine((value) => /^-?\d+$/.test(value), {
      error: "Use a whole number of days.",
    })
    .transform((value) => Number(value))
    .refine((value) => value >= 0, { error: "Days cannot be negative." })
    .refine((value) => value <= 999, {
      error: "Keep it at 999 days or fewer.",
    }),
  eligibleGender: z.enum(["", "male", "female"], {
    error: "Choose a gender eligibility.",
  }),
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

export const EmployeeSchema = z
  .object({
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
  })
  .refine(
    (value) =>
      !value.birthdate || !value.hireDate || value.birthdate <= value.hireDate,
    {
      error: "Birthdate must be on or before the hire date.",
      path: ["birthdate"],
    }
  )
  .refine((value) => !value.birthdate || value.birthdate <= todayISO, {
    error: "Birthdate cannot be in the future.",
    path: ["birthdate"],
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
    startDate: requiredDate("Start date must be a valid date."),
    endDate: requiredDate("End date must be a valid date."),
    days: z.coerce
      .number()
      .min(0.5, { error: "Days must be at least 0.5." })
      .max(365, { error: "Keep requests to 365 days or fewer." })
      .multipleOf(0.5, { error: "Use half-day increments." }),
    reason: z
      .string()
      .trim()
      .max(500, { error: "Keep it under 500 characters." }),
  })
  .refine((value) => value.startDate >= todayInCompanyTimeZone(), {
    error: "Start date cannot be in the past.",
    path: ["startDate"],
  })
  .refine((value) => value.endDate >= value.startDate, {
    error: "End date must be on or after the start date.",
    path: ["endDate"],
  })
  .refine(
    (value) => value.startDate.slice(0, 4) === value.endDate.slice(0, 4),
    {
      error: "A leave request cannot span two calendar years.",
      path: ["endDate"],
    }
  )
  .refine(
    (value) => leaveSpanDays(value.startDate, value.endDate) >= value.days,
    {
      error: "Days cannot exceed the selected working-day range.",
      path: ["days"],
    }
  )
  .refine((value) => leaveSpanDays(value.startDate, value.endDate) > 0, {
    error: "Select at least one working day (Mon-Fri).",
    path: ["startDate"],
  });

export const ChangePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { error: "Enter your current password." }),
    password: PasswordSchema,
    confirmPassword: z.string().min(1, { error: "Confirm the new password." }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

function leaveSpanDays(startDate: string, endDate: string) {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return 0;
  }

  let count = 0;

  for (
    const day = new Date(start);
    day.getTime() <= end;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    const weekday = day.getUTCDay();

    if (weekday !== 0 && weekday !== 6) {
      count += 1;
    }
  }

  return count;
}
