"use client";

import { useTransition } from "react";
import {
  CheckIcon,
  EllipsisVerticalIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import type { LeaveRequestItem } from "@/lib/leave";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { decideLeave, deleteLeave } from "./actions";

export function LeaveRowActions({
  request,
  canDecide,
  canDelete,
}: {
  request: LeaveRequestItem;
  canDecide: boolean;
  canDelete: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const showDecision = canDecide && request.status === "pending";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Leave request actions"
        >
          <EllipsisVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {showDecision && (
          <>
            <DropdownMenuItem
              disabled={pending}
              onSelect={() =>
                startTransition(() => decideLeave(request.id, "approved"))
              }
            >
              <CheckIcon />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={pending}
              onSelect={() =>
                startTransition(() => decideLeave(request.id, "rejected"))
              }
            >
              <XIcon />
              Reject
            </DropdownMenuItem>
            {canDelete && <DropdownMenuSeparator />}
          </>
        )}

        {canDelete && (
          <DropdownMenuItem
            variant="destructive"
            disabled={pending}
            onSelect={() => startTransition(() => deleteLeave(request.id))}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
