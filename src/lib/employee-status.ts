// Statuses that may sign in, file leave, or be selected as a manager.
// "on_leave" is still an active employment state.
export const EMPLOYEE_WORKING_STATUSES = ["active", "on_leave"] as const;

export function isWorkingEmployeeStatus(status: string): boolean {
  return (EMPLOYEE_WORKING_STATUSES as readonly string[]).includes(status);
}
