"use client";

import { useState, useTransition } from "react";
import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { Department } from "@/lib/departments";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteDepartment } from "./actions";
import { DepartmentForm } from "./forms";

export function DepartmentRowActions({
  department,
}: {
  department: Department;
}) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Department actions"
          >
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
        title="Delete this department?"
        description={
          <>
            {department.name} will be removed. Employees currently assigned to
            it will become unassigned.
          </>
        }
        confirmLabel="Delete department"
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteDepartment(department.id);

            if (!result.success) {
              toast.error(result.message ?? "Could not delete the department.");
              return;
            }

            toast.success(result.message ?? "Department deleted");
            setConfirmOpen(false);
          })
        }
      />

      <DepartmentForm
        department={department}
        open={open}
        onOpenChange={setOpen}
        hideTrigger
      />
    </>
  );
}
