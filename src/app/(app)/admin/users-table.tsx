"use client";

import { useActionState, useTransition } from "react";
import { ChevronDownIcon } from "lucide-react";
import type { AdminUserRow } from "@/lib/admin";
import { isRole, ROLES } from "@/lib/roles";
import { resetUserPassword, setUserActive, setUserRole } from "./user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FieldError } from "@/components/form-feedback";

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

function UserRow({ user, isSelf }: { user: AdminUserRow; isSelf: boolean }) {
  const [pending, startTransition] = useTransition();

  function changeRole(value: string) {
    if (!isRole(value)) {
      return;
    }

    startTransition(async () => {
      await setUserRole(user.id, value);
    });
  }

  function changeActive(value: string) {
    startTransition(async () => {
      await setUserActive(user.id, value === "true");
    });
  }

  return (
    <tr className="border-b last:border-0">
      <td className="px-3 py-3">
        {user.email}
        {isSelf && (
          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
        )}
      </td>

      <td className="px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isSelf || pending}
              className="w-28 justify-between capitalize"
            >
              {user.role}
              <ChevronDownIcon className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel>Role</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={user.role}
              onValueChange={changeRole}
            >
              {ROLES.map((role) => (
                <DropdownMenuRadioItem
                  key={role}
                  value={role}
                  className="capitalize"
                >
                  {role}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>

      <td className="px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isSelf || pending}
              className="w-28 justify-between"
            >
              {user.isActive ? "Active" : "Disabled"}
              <ChevronDownIcon className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={user.isActive ? "true" : "false"}
              onValueChange={changeActive}
            >
              <DropdownMenuRadioItem value="true">Active</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="false">
                Disabled
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
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

      <td className="px-3 py-3 text-muted-foreground">{user.createdAt}</td>
    </tr>
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
            <th className="px-3 py-2 font-medium">Role</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Reset password</th>
            <th className="px-3 py-2 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
