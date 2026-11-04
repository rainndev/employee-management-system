"use client";

import { useActionState, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Option } from "@/lib/employees";
import type { LeaveType } from "@/lib/leave";
import type { ActionState } from "@/lib/definitions";
import { createLeaveRequestAction } from "./actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownSelect } from "@/components/dropdown-select";
import { DatePicker } from "@/components/date-picker";
import { FieldError, FormFeedback } from "@/components/form-feedback";
import { countLeaveDays } from "@/lib/leave-days";

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="grid content-start gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <FieldError messages={error} />
    </div>
  );
}

export function LeaveRequestForm({
  leaveTypes,
  employees,
  today,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  leaveTypes: LeaveType[];
  employees?: Option[];
  today: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [visibleState, setVisibleState] = useState<ActionState>(undefined);
  const [, action, pending] = useActionState<ActionState, FormData>(
    async (previous, formData) => {
      const next = await createLeaveRequestAction(previous, formData);
      setVisibleState(next);
      if (next?.success) {
        setOpen(false);
        toast.success("Leave request submitted");
      } else if (next?.message) {
        toast.error(next.message);
      } else if (next?.errors) {
        toast.error("Please fix the highlighted fields.");
      }
      return next;
    },
    undefined
  );
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const workingDays = useMemo(
    () => countLeaveDays(startDate, endDate),
    [startDate, endDate]
  );
  const canHalfDay =
    startDate !== "" && startDate === endDate && workingDays === 1;
  const halfDayActive = halfDay && canHalfDay;
  const days = halfDayActive ? 0.5 : workingDays;

  function changeStartDate(value: string) {
    setStartDate(value);
    setHalfDay(false);
  }

  function changeEndDate(value: string) {
    setEndDate(value);
    setHalfDay(false);
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      setVisibleState(undefined);
      setStartDate("");
      setEndDate("");
      setHalfDay(false);
    }

    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button>New leave request</Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New leave request</DialogTitle>
          <DialogDescription>
            Requests start as pending and need an approver.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-4">
          {employees && (
            <Field
              label="Employee"
              htmlFor={fieldId("employeeId")}
              error={visibleState?.errors?.employeeId}
            >
              <DropdownSelect
                name="employeeId"
                id={fieldId("employeeId")}
                options={employees.map((option) => ({
                  value: option.id,
                  label: option.label,
                }))}
                placeholder="— Select employee —"
                ariaInvalid={Boolean(visibleState?.errors?.employeeId)}
              />
            </Field>
          )}

          <Field
            label="Leave type"
            htmlFor={fieldId("leaveTypeId")}
            error={visibleState?.errors?.leaveTypeId}
          >
            <DropdownSelect
              name="leaveTypeId"
              id={fieldId("leaveTypeId")}
              options={leaveTypes.map((type) => ({
                value: type.id,
                label: type.name,
              }))}
              placeholder="— Select type —"
              ariaInvalid={Boolean(visibleState?.errors?.leaveTypeId)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Start date"
              htmlFor={fieldId("startDate")}
              error={visibleState?.errors?.startDate}
            >
              <DatePicker
                id={fieldId("startDate")}
                name="startDate"
                value={startDate}
                onValueChange={(value) => changeStartDate(value ?? "")}
                placeholder="Pick a date"
                invalid={Boolean(visibleState?.errors?.startDate)}
                minDate={today}
              />
            </Field>

            <Field
              label="End date"
              htmlFor={fieldId("endDate")}
              error={visibleState?.errors?.endDate}
            >
              <DatePicker
                id={fieldId("endDate")}
                name="endDate"
                value={endDate}
                onValueChange={(value) => changeEndDate(value ?? "")}
                placeholder="Pick a date"
                invalid={Boolean(visibleState?.errors?.endDate)}
                minDate={startDate || today}
              />
            </Field>

            <Field
              label="Days"
              htmlFor={fieldId("days")}
              error={visibleState?.errors?.days}
            >
              <Input
                id={fieldId("days")}
                name="days"
                type="number"
                value={days > 0 ? days : ""}
                placeholder="—"
                readOnly
                aria-readonly
                aria-invalid={Boolean(visibleState?.errors?.days)}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="halfDay"
              checked={halfDayActive}
              onChange={(event) => setHalfDay(event.target.checked)}
              disabled={!canHalfDay}
              className="size-4 accent-primary disabled:opacity-50"
            />
            Half day (single working day)
          </label>

          <Field
            label="Reason"
            htmlFor={fieldId("reason")}
            error={visibleState?.errors?.reason}
          >
            <Textarea
              id={fieldId("reason")}
              name="reason"
              aria-invalid={Boolean(visibleState?.errors?.reason)}
            />
          </Field>

          <FormFeedback state={visibleState} />

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Submitting..." : "Submit request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
