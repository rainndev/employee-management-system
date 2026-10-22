"use client";

import { useTransition } from "react";
import {
  CheckIcon,
  EllipsisVerticalIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
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
  const hasActions = showDecision || canDelete;

  if (!hasActions) {
    return null;
  }

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
                startTransition(async () => {
                  try {
                    await decideLeave(request.id, "approved");
                    toast.success("Leave request approved");
                  } catch {
                    toast.error("Could not update the request.");
                  }
                })
              }
            >
              <CheckIcon />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={pending}
              onSelect={() =>
                startTransition(async () => {
                  try {
                    await decideLeave(request.id, "rejected");
                    toast.success("Leave request rejected");
                  } catch {
                    toast.error("Could not update the request.");
                  }
                })
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
            onSelect={() =>
              startTransition(async () => {
                try {
                  await deleteLeave(request.id);
                  toast.success("Leave request deleted");
                } catch {
                  toast.error("Could not delete the request.");
                }
              })
            }
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
