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
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  leaveTypes: LeaveType[];
  employees?: Option[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (previous, formData) => {
      const next = await createLeaveRequestAction(previous, formData);
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
  const days = useMemo(
    () => countLeaveDays(startDate, endDate),
    [startDate, endDate]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              error={state?.errors?.employeeId}
            >
              <DropdownSelect
                name="employeeId"
                id={fieldId("employeeId")}
                options={employees.map((option) => ({
                  value: option.id,
                  label: option.label,
                }))}
                placeholder="— Select employee —"
                ariaInvalid={Boolean(state?.errors?.employeeId)}
              />
            </Field>
          )}

          <Field
            label="Leave type"
            htmlFor={fieldId("leaveTypeId")}
            error={state?.errors?.leaveTypeId}
          >
            <DropdownSelect
              name="leaveTypeId"
              id={fieldId("leaveTypeId")}
              options={leaveTypes.map((type) => ({
                value: type.id,
                label: type.name,
              }))}
              placeholder="— Select type —"
              ariaInvalid={Boolean(state?.errors?.leaveTypeId)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Start date"
              htmlFor={fieldId("startDate")}
              error={state?.errors?.startDate}
            >
              <DatePicker
                id={fieldId("startDate")}
                name="startDate"
                value={startDate}
                onValueChange={(value) => setStartDate(value ?? "")}
                placeholder="Pick a date"
                invalid={Boolean(state?.errors?.startDate)}
              />
            </Field>

            <Field
              label="End date"
              htmlFor={fieldId("endDate")}
              error={state?.errors?.endDate}
            >
              <DatePicker
                id={fieldId("endDate")}
                name="endDate"
                value={endDate}
                onValueChange={(value) => setEndDate(value ?? "")}
                placeholder="Pick a date"
                invalid={Boolean(state?.errors?.endDate)}
              />
            </Field>

            <Field
              label="Days"
              htmlFor={fieldId("days")}
              error={state?.errors?.days}
            >
              <Input
                id={fieldId("days")}
                name="days"
                type="number"
                value={days > 0 ? days : ""}
                placeholder="—"
                readOnly
                aria-readonly
                aria-invalid={Boolean(state?.errors?.days)}
              />
            </Field>
          </div>

          <Field
            label="Reason"
            htmlFor={fieldId("reason")}
            error={state?.errors?.reason}
          >
            <Textarea
              id={fieldId("reason")}
              name="reason"
              aria-invalid={Boolean(state?.errors?.reason)}
            />
          </Field>

          <FormFeedback state={state} />

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
