// Must stay in sync with the user_role_check constraint in db/schema.sql.
export const ROLES = ["admin", "hr", "manager", "employee"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" && (ROLES as readonly string[]).includes(value)
  );
}
