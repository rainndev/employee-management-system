"use client";

import { useFormStatus } from "react-dom";
import type { AdminUserRow } from "@/lib/admin";
import { ROLES } from "@/lib/roles";
import { updateUser } from "./user-actions";

const selectClass =
  "rounded-md border border-black/15 bg-transparent px-2 py-1 text-sm outline-none disabled:opacity-50 dark:border-white/20";

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-md border border-black/15 px-3 py-1 text-sm font-medium transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/[.06]"
    >
      {pending ? "Saving..." : "Save"}
    </button>
  );
}

export function UsersTable({
  users,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  if (users.length === 0) {
    return <p className="text-sm text-zinc-500">No users yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-black/10 text-xs text-zinc-500 dark:border-white/15">
          <tr>
            <th className="px-4 py-2 font-medium">Email</th>
            <th className="px-4 py-2 font-medium">Access</th>
            <th className="px-4 py-2 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;

            return (
              <tr
                key={user.id}
                className="border-b border-black/5 last:border-0 dark:border-white/10"
              >
                <td className="px-4 py-3">
                  {user.email}
                  {isSelf && (
                    <span className="ml-2 text-xs text-zinc-500">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <form action={updateUser} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="role"
                      defaultValue={user.role}
                      disabled={isSelf}
                      aria-label="Role"
                      className={selectClass}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <select
                      name="isActive"
                      defaultValue={String(user.isActive)}
                      disabled={isSelf}
                      aria-label="Status"
                      className={selectClass}
                    >
                      <option value="true">Active</option>
                      <option value="false">Disabled</option>
                    </select>
                    <SaveButton disabled={isSelf} />
                  </form>
                </td>
                <td className="px-4 py-3 text-zinc-500">{user.createdAt}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
