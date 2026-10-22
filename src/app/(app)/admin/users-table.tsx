"use client";

import { useActionState, useTransition } from "react";
import { ChevronDownIcon } from "lucide-react";
import { toast } from "sonner";
import type { AdminUserRow } from "@/lib/admin";
import type { ResetPasswordState } from "@/lib/definitions";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FieldError } from "@/components/form-feedback";

function PasswordResetForm({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(
    async (previous, formData) => {
      const next = await resetUserPassword(previous, formData);
      if (next?.success) {
        toast.success("Password updated");
      } else if (next?.message) {
        toast.error(next.message);
      } else if (next?.errors) {
        toast.error("Please choose a valid password.");
      }
      return next;
    },
    undefined
  );

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
      try {
        await setUserRole(user.id, value);
        toast.success(`Role changed to ${value}`);
      } catch {
        toast.error("Could not update the role.");
      }
    });
  }

  function changeActive(value: string) {
    startTransition(async () => {
      try {
        await setUserActive(user.id, value === "true");
        toast.success(
          value === "true" ? "Account enabled" : "Account disabled"
        );
      } catch {
        toast.error("Could not update the account.");
      }
    });
  }

  return (
    <TableRow>
      <TableCell>
        {user.email}
        {isSelf && (
          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
        )}
      </TableCell>

      <TableCell>
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
      </TableCell>

      <TableCell>
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
      </TableCell>

      <TableCell>
        {isSelf ? (
          <span className="text-xs text-muted-foreground">
            Not available for your own account
          </span>
        ) : (
          <PasswordResetForm userId={user.id} email={user.email} />
        )}
      </TableCell>

      <TableCell className="text-muted-foreground">{user.createdAt}</TableCell>
    </TableRow>
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
    <div className="overflow-hidden rounded-xl border p-4">
      <Table>
        <TableHeader className="[&_th]:text-muted-foreground">
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reset password</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
