"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AdminUserRow } from "@/lib/admin";
import { ROLES } from "@/lib/roles";
import { resetUserPassword, updateUser } from "./user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { FieldError } from "@/components/form-feedback";

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" disabled={disabled || pending}>
      {pending ? "Saving..." : "Save"}
    </Button>
  );
}

function PasswordResetForm({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [state, action, pending] = useActionState(resetUserPassword, undefined);

  return (
    <form action={action} className="flex flex-col gap-1.5">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex items-center gap-2">
        <Input
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="New password"
          aria-label={`New password for ${email}`}
          className="h-8 w-40"
          aria-invalid={Boolean(state?.errors?.password)}
        />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Resetting..." : "Reset"}
        </Button>
      </div>
      <FieldError messages={state?.errors?.password} />
      {state?.message && (
        <p className="text-xs text-destructive">{state.message}</p>
      )}
      {state?.success && (
        <p className="text-xs text-emerald-600">Password updated.</p>
      )}
    </form>
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
    return <p className="text-sm text-muted-foreground">No users yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">Access</th>
            <th className="px-3 py-2 font-medium">Reset password</th>
            <th className="px-3 py-2 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;

            return (
              <tr key={user.id} className="border-b last:border-0">
                <td className="px-3 py-3">
                  {user.email}
                  {isSelf && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (you)
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <form action={updateUser} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <NativeSelect
                      name="role"
                      defaultValue={user.role}
                      disabled={isSelf}
                      aria-label="Role"
                      className="w-32"
                    >
                      {ROLES.map((role) => (
                        <NativeSelectOption key={role} value={role}>
                          {role}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <NativeSelect
                      name="isActive"
                      defaultValue={String(user.isActive)}
                      disabled={isSelf}
                      aria-label="Status"
                      className="w-32"
                    >
                      <NativeSelectOption value="true">
                        Active
                      </NativeSelectOption>
                      <NativeSelectOption value="false">
                        Disabled
                      </NativeSelectOption>
                    </NativeSelect>
                    <SaveButton disabled={isSelf} />
                  </form>
                </td>
                <td className="px-3 py-3">
                  {isSelf ? (
                    <span className="text-xs text-muted-foreground">
                      Not available for your own account
                    </span>
                  ) : (
                    <PasswordResetForm userId={user.id} email={user.email} />
                  )}
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {user.createdAt}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
