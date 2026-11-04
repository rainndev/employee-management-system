"use client";

import { useState, useTransition } from "react";
import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { Position } from "@/lib/positions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deletePosition } from "./actions";
import { PositionForm } from "./forms";

export function PositionRowActions({ position }: { position: Position }) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Position actions">
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
        title="Delete this position?"
        description={
          <>
            {position.title} will be removed. Employees currently assigned to it
            will become unassigned.
          </>
        }
        confirmLabel="Delete position"
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deletePosition(position.id);

            if (!result.success) {
              toast.error(result.message ?? "Could not delete the position.");
              return;
            }

            toast.success(result.message ?? "Position deleted");
            setConfirmOpen(false);
          })
        }
      />

      <PositionForm
        position={position}
        open={open}
        onOpenChange={setOpen}
        hideTrigger
      />
    </>
  );
}
