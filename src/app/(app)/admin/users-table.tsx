"use client";

import { useActionState, useMemo, useTransition } from "react";
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
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/components/data-table";
import { FieldError } from "@/components/form-feedback";

const ROLE_OPTIONS = ROLES.map((role) => ({
  value: role,
  label: role.charAt(0).toUpperCase() + role.slice(1),
}));

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
];

function getSearchText(user: AdminUserRow) {
  return [
    user.email,
    user.role,
    user.isActive ? "active" : "disabled",
    user.createdAt,
  ].join(" ");
}

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

function RoleDropdown({
  user,
  isSelf,
}: {
  user: AdminUserRow;
  isSelf: boolean;
}) {
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

  return (
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
        <DropdownMenuRadioGroup value={user.role} onValueChange={changeRole}>
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
  );
}

function ActiveDropdown({
  user,
  isSelf,
}: {
  user: AdminUserRow;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

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
          <DropdownMenuRadioItem value="false">Disabled</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UsersTable({
  users,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  const columns = useMemo<DataTableColumn<AdminUserRow>[]>(
    () => [
      {
        id: "email",
        accessorFn: (user) => user.email,
        header: "Email",
        cell: ({ row }) => (
          <span>
            {row.original.email}
            {row.original.id === currentUserId && (
              <span className="ml-2 text-xs text-muted-foreground">(you)</span>
            )}
          </span>
        ),
      },
      {
        id: "role",
        accessorFn: (user) => user.role,
        header: "Role",
        cell: ({ row }) => (
          <RoleDropdown
            user={row.original}
            isSelf={row.original.id === currentUserId}
          />
        ),
      },
      {
        id: "status",
        accessorFn: (user) => (user.isActive ? "active" : "disabled"),
        header: "Status",
        cell: ({ row }) => (
          <ActiveDropdown
            user={row.original}
            isSelf={row.original.id === currentUserId}
          />
        ),
      },
      {
        id: "password",
        header: "Reset password",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.id === currentUserId ? (
            <span className="text-xs text-muted-foreground">
              Not available for your own account
            </span>
          ) : (
            <PasswordResetForm
              userId={row.original.id}
              email={row.original.email}
            />
          ),
      },
      {
        id: "createdAt",
        accessorFn: (user) => user.createdAt,
        header: "Created",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.createdAt}
          </span>
        ),
      },
    ],
    [currentUserId]
  );

  const filters = useMemo<DataTableFilter<AdminUserRow>[]>(
    () => [
      {
        id: "role",
        allLabel: "All roles",
        options: ROLE_OPTIONS,
        getValue: (user) => user.role,
      },
      {
        id: "status",
        allLabel: "All statuses",
        options: STATUS_OPTIONS,
        getValue: (user) => (user.isActive ? "active" : "disabled"),
      },
    ],
    []
  );

  return (
    <DataTable
      data={users}
      columns={columns}
      filters={filters}
      getSearchText={getSearchText}
      searchPlaceholder="Search email or role..."
      emptyMessage="No users match your search."
    />
  );
}
