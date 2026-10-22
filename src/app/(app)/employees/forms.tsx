"use client";

import { useActionState, useId } from "react";
import type { EmployeeDetail, Option } from "@/lib/employees";
import { saveEmployee } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { FieldError, FormFeedback } from "@/components/form-feedback";

type Props = {
  employee?: EmployeeDetail;
  departments: Option[];
  positions: Option[];
  managers: Option[];
  users: Option[];
};

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

export function EmployeeForm({
  employee,
  departments,
  positions,
  managers,
  users,
}: Props) {
  const [state, action, pending] = useActionState(saveEmployee, undefined);
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;
  const errors = state?.errors;
  const invalid = (name: keyof NonNullable<typeof errors>) =>
    Boolean(errors?.[name]);

  return (
    <form action={action} className="flex flex-col gap-4">
      {employee && <input type="hidden" name="id" value={employee.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Employee number"
          htmlFor={fieldId("employeeNo")}
          error={errors?.employeeNo}
        >
          <Input
            id={fieldId("employeeNo")}
            name="employeeNo"
            defaultValue={employee?.employeeNo}
            aria-invalid={invalid("employeeNo")}
          />
        </Field>

        <Field
          label="Status"
          htmlFor={fieldId("status")}
          error={errors?.status}
        >
          <NativeSelect
            id={fieldId("status")}
            name="status"
            defaultValue={employee?.status ?? "active"}
            className="w-full"
            aria-invalid={invalid("status")}
          >
            <NativeSelectOption value="active">active</NativeSelectOption>
            <NativeSelectOption value="on_leave">on_leave</NativeSelectOption>
            <NativeSelectOption value="inactive">inactive</NativeSelectOption>
            <NativeSelectOption value="terminated">
              terminated
            </NativeSelectOption>
          </NativeSelect>
        </Field>

        <Field
          label="First name"
          htmlFor={fieldId("firstName")}
          error={errors?.firstName}
        >
          <Input
            id={fieldId("firstName")}
            name="firstName"
            defaultValue={employee?.firstName}
            aria-invalid={invalid("firstName")}
          />
        </Field>

        <Field
          label="Last name"
          htmlFor={fieldId("lastName")}
          error={errors?.lastName}
        >
          <Input
            id={fieldId("lastName")}
            name="lastName"
            defaultValue={employee?.lastName}
            aria-invalid={invalid("lastName")}
          />
        </Field>

        <Field
          label="Birthdate"
          htmlFor={fieldId("birthdate")}
          error={errors?.birthdate}
        >
          <Input
            id={fieldId("birthdate")}
            name="birthdate"
            type="date"
            defaultValue={employee?.birthdate}
            aria-invalid={invalid("birthdate")}
          />
        </Field>

        <Field
          label="Gender"
          htmlFor={fieldId("gender")}
          error={errors?.gender}
        >
          <NativeSelect
            id={fieldId("gender")}
            name="gender"
            defaultValue={employee?.gender ?? ""}
            className="w-full"
            aria-invalid={invalid("gender")}
          >
            <NativeSelectOption value="">—</NativeSelectOption>
            <NativeSelectOption value="male">male</NativeSelectOption>
            <NativeSelectOption value="female">female</NativeSelectOption>
            <NativeSelectOption value="other">other</NativeSelectOption>
          </NativeSelect>
        </Field>

        <Field label="Phone" htmlFor={fieldId("phone")} error={errors?.phone}>
          <Input
            id={fieldId("phone")}
            name="phone"
            defaultValue={employee?.phone}
            aria-invalid={invalid("phone")}
          />
        </Field>

        <Field
          label="Hire date"
          htmlFor={fieldId("hireDate")}
          error={errors?.hireDate}
        >
          <Input
            id={fieldId("hireDate")}
            name="hireDate"
            type="date"
            defaultValue={employee?.hireDate}
            aria-invalid={invalid("hireDate")}
          />
        </Field>

        <Field
          label="Department"
          htmlFor={fieldId("departmentId")}
          error={errors?.departmentId}
        >
          <NativeSelect
            id={fieldId("departmentId")}
            name="departmentId"
            defaultValue={employee?.departmentId ?? ""}
            className="w-full"
            aria-invalid={invalid("departmentId")}
          >
            <NativeSelectOption value="">— None —</NativeSelectOption>
            {departments.map((option) => (
              <NativeSelectOption key={option.id} value={option.id}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field
          label="Position"
          htmlFor={fieldId("positionId")}
          error={errors?.positionId}
        >
          <NativeSelect
            id={fieldId("positionId")}
            name="positionId"
            defaultValue={employee?.positionId ?? ""}
            className="w-full"
            aria-invalid={invalid("positionId")}
          >
            <NativeSelectOption value="">— None —</NativeSelectOption>
            {positions.map((option) => (
              <NativeSelectOption key={option.id} value={option.id}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field
          label="Manager"
          htmlFor={fieldId("managerId")}
          error={errors?.managerId}
        >
          <NativeSelect
            id={fieldId("managerId")}
            name="managerId"
            defaultValue={employee?.managerId ?? ""}
            className="w-full"
            aria-invalid={invalid("managerId")}
          >
            <NativeSelectOption value="">— None —</NativeSelectOption>
            {managers.map((option) => (
              <NativeSelectOption key={option.id} value={option.id}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field
          label="Linked user account"
          htmlFor={fieldId("userId")}
          error={errors?.userId}
        >
          <NativeSelect
            id={fieldId("userId")}
            name="userId"
            defaultValue={employee?.userId ?? ""}
            className="w-full"
            aria-invalid={invalid("userId")}
          >
            <NativeSelectOption value="">— None —</NativeSelectOption>
            {users.map((option) => (
              <NativeSelectOption key={option.id} value={option.id}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <Field
        label="Address"
        htmlFor={fieldId("address")}
        error={errors?.address}
      >
        <Textarea
          id={fieldId("address")}
          name="address"
          defaultValue={employee?.address}
          aria-invalid={invalid("address")}
        />
      </Field>

      <FormFeedback state={state} />

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : employee ? "Save changes" : "Add employee"}
      </Button>
    </form>
  );
}
