"use client";

import { useActionState, useId, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import { FieldError, FormFeedback } from "@/components/form-feedback";

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
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <FieldError messages={error} />
    </div>
  );
}

export function LeaveRequestForm({
  leaveTypes,
  employees,
}: {
  leaveTypes: LeaveType[];
  employees?: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (previous, formData) => {
      const next = await createLeaveRequestAction(previous, formData);
      if (next?.success) {
        setOpen(false);
      }
      return next;
    },
    undefined
  );
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New leave request</Button>
      </DialogTrigger>

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
              <Select name="employeeId">
                <SelectTrigger
                  id={fieldId("employeeId")}
                  className="w-full"
                  aria-invalid={Boolean(state?.errors?.employeeId)}
                >
                  <SelectValue placeholder="— Select employee —" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field
            label="Leave type"
            htmlFor={fieldId("leaveTypeId")}
            error={state?.errors?.leaveTypeId}
          >
            <Select name="leaveTypeId">
              <SelectTrigger
                id={fieldId("leaveTypeId")}
                className="w-full"
                aria-invalid={Boolean(state?.errors?.leaveTypeId)}
              >
                <SelectValue placeholder="— Select type —" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                min="0.5"
                step="0.5"
                defaultValue="1"
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
