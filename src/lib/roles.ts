// Must stay in sync with the user_role_check constraint in db/schema.sql.
export const ROLES = ["admin", "hr", "manager", "employee"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" && (ROLES as readonly string[]).includes(value)
  );
}

// Roles that may create and change records.
export function canManage(role: Role): boolean {
  return role === "admin" || role === "hr";
}

// Roles that may approve or reject leave requests.
export function canApprove(role: Role): boolean {
  return role === "admin" || role === "hr" || role === "manager";
}
