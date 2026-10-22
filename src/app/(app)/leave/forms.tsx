"use client";

import { useActionState, useId } from "react";
import type { Option } from "@/lib/employees";
import type { LeaveType } from "@/lib/leave";
import { createLeaveRequestAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
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
  const [state, action, pending] = useActionState(
    createLeaveRequestAction,
    undefined
  );
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  return (
    <form action={action} className="flex flex-col gap-4">
      {employees && (
        <Field
          label="Employee"
          htmlFor={fieldId("employeeId")}
          error={state?.errors?.employeeId}
        >
          <NativeSelect
            id={fieldId("employeeId")}
            name="employeeId"
            defaultValue=""
            className="w-full"
            aria-invalid={Boolean(state?.errors?.employeeId)}
          >
            <NativeSelectOption value="">
              — Select employee —
            </NativeSelectOption>
            {employees.map((option) => (
              <NativeSelectOption key={option.id} value={option.id}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      )}

      <Field
        label="Leave type"
        htmlFor={fieldId("leaveTypeId")}
        error={state?.errors?.leaveTypeId}
      >
        <NativeSelect
          id={fieldId("leaveTypeId")}
          name="leaveTypeId"
          defaultValue=""
          className="w-full"
          aria-invalid={Boolean(state?.errors?.leaveTypeId)}
        >
          <NativeSelectOption value="">— Select type —</NativeSelectOption>
          {leaveTypes.map((type) => (
            <NativeSelectOption key={type.id} value={type.id}>
              {type.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Start date"
          htmlFor={fieldId("startDate")}
          error={state?.errors?.startDate}
        >
          <Input
            id={fieldId("startDate")}
            name="startDate"
            type="date"
            aria-invalid={Boolean(state?.errors?.startDate)}
          />
        </Field>

        <Field
          label="End date"
          htmlFor={fieldId("endDate")}
          error={state?.errors?.endDate}
        >
          <Input
            id={fieldId("endDate")}
            name="endDate"
            type="date"
            aria-invalid={Boolean(state?.errors?.endDate)}
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

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Submitting..." : "Submit request"}
      </Button>
    </form>
  );
}
