"use client";

import { useState, useTransition } from "react";
import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { EmployeeListItem, Option } from "@/lib/employees";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteEmployee } from "./actions";
import { EmployeeForm } from "./forms";

export function EmployeeRowActions({
  employee,
  departments,
  positions,
  managers,
  users,
}: {
  employee: EmployeeListItem;
  departments: Option[];
  positions: Option[];
  managers: Option[];
  users: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Employee actions">
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={pending}
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this employee?"
        description={
          <>
            {employee.name} ({employee.employeeNo}) will be removed from the
            directory. Their linked account will be disabled, pending leave will
            be cancelled, and direct reports will be unassigned.
          </>
        }
        confirmLabel="Delete employee"
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteEmployee(employee.id);

            if (!result.success) {
              toast.error(result.message ?? "Could not delete the employee.");
              return;
            }

            toast.success("Employee deleted");
            setConfirmOpen(false);
          })
        }
      />

      <EmployeeForm
        employee={employee}
        departments={departments}
        positions={positions}
        managers={managers}
        users={users}
        open={open}
        onOpenChange={setOpen}
        hideTrigger
      />
    </>
  );
}
