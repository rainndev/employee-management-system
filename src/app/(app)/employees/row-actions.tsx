"use client";

import { useState, useTransition } from "react";
import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import type { EmployeeListItem, Option } from "@/lib/employees";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
            onSelect={() => startTransition(() => deleteEmployee(employee.id))}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
