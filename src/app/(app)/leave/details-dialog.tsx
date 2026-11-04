"use client";

import { useState, useTransition } from "react";
import {
  CalendarClockIcon,
  CalendarRangeIcon,
  CheckIcon,
  CircleCheckIcon,
  ClockIcon,
  EyeIcon,
  MessageSquareTextIcon,
  Trash2Icon,
  UserCheckIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { LeaveRequestItem } from "@/lib/leave";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { DateRange } from "@/components/date-range";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import {
  decideLeave,
  deleteLeave,
  type LeaveActionResult,
} from "./actions";

function DetailItem({
  icon,
  label,
  children,
  className,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <Item variant="muted" size="xs" className={cn("items-start", className)}>
      <ItemMedia variant="icon" className="mt-0.5 text-muted-foreground">
        {icon}
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="text-xs font-normal text-muted-foreground">
          {label}
        </ItemTitle>
        <div className={cn("text-sm font-medium", valueClassName)}>
          {children}
        </div>
      </ItemContent>
    </Item>
  );
}

export function LeaveDetailsDialog({
  request,
  canDecide,
  canDelete,
}: {
  request: LeaveRequestItem;
  canDecide: boolean;
  canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const showDecision = canDecide && request.status === "pending";

  function run(
    action: () => Promise<LeaveActionResult>,
    success: string,
    error: string
  ) {
    startTransition(async () => {
      try {
        const result = await action();

        if (!result.success) {
          toast.error(result.message ?? error);
          return;
        }

        toast.success(success);
        setOpen(false);
      } catch {
        toast.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="View leave request details"
          title="View details"
        >
          <EyeIcon />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Leave request details</DialogTitle>
          <DialogDescription>
            {request.employeeName} · {request.employeeNo}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{request.leaveType}</Badge>
          <StatusBadge status={request.status} />
        </div>

        <Separator />

        <ItemGroup className="gap-2">
          <DetailItem icon={<CalendarRangeIcon />} label="Dates">
            <DateRange
              start={request.startDate}
              end={request.endDate}
              layout="inline"
            />
          </DetailItem>

          <DetailItem icon={<ClockIcon />} label="Days">
            {request.days}
          </DetailItem>

          <DetailItem icon={<UserCheckIcon />} label="Approver">
            {request.approverName ?? "—"}
          </DetailItem>

          <DetailItem icon={<CalendarClockIcon />} label="Requested at">
            {request.createdAt}
          </DetailItem>

          {request.decidedAt && (
            <DetailItem icon={<CircleCheckIcon />} label="Decided at">
              {request.decidedAt}
            </DetailItem>
          )}

          <DetailItem
            icon={<MessageSquareTextIcon />}
            label="Reason"
            valueClassName="font-normal whitespace-pre-wrap"
          >
            {request.reason || "—"}
          </DetailItem>
        </ItemGroup>

        <DialogFooter className="sm:justify-between">
          <div>
            {canDelete && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={pending}
                onClick={() =>
                  run(
                    () => deleteLeave(request.id),
                    "Leave request deleted",
                    "Could not delete the request."
                  )
                }
              >
                <Trash2Icon />
                Delete
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {showDecision && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => decideLeave(request.id, "rejected"),
                      "Leave request rejected",
                      "Could not update the request."
                    )
                  }
                >
                  <XIcon />
                  Reject
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => decideLeave(request.id, "approved"),
                      "Leave request approved",
                      "Could not update the request."
                    )
                  }
                >
                  <CheckIcon />
                  Approve
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
