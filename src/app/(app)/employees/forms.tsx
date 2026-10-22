"use client";

import { useActionState, useId, useState } from "react";
import { WandSparklesIcon } from "lucide-react";
import type { EmployeeDetail, Option } from "@/lib/employees";
import { NONE_VALUE } from "@/lib/constants";
import type { ActionState } from "@/lib/definitions";
import { saveEmployee } from "./actions";

function generateEmployeeNumber() {
  return `EMP-${Math.floor(100000 + Math.random() * 900000)}`;
}
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
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: Props & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [employeeNo, setEmployeeNo] = useState(employee?.employeeNo ?? "");

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setEmployeeNo(employee?.employeeNo ?? "");
    }
    setOpen(next);
  };
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (previous, formData) => {
      const next = await saveEmployee(previous, formData);
      if (next?.success) {
        setOpen(false);
      }
      return next;
    },
    undefined
  );
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;
  const errors = state?.errors;
  const invalid = (name: keyof NonNullable<typeof errors>) =>
    Boolean(errors?.[name]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button
            variant={employee ? "outline" : "default"}
            size={employee ? "sm" : "default"}
          >
            {employee ? "Edit" : "Add employee"}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {employee ? "Edit employee" : "Add employee"}
          </DialogTitle>
          <DialogDescription>
            {employee
              ? `${employee.firstName} ${employee.lastName} · ${employee.employeeNo}`
              : "Create an employee record and optionally link a user account."}
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-4">
          {employee && <input type="hidden" name="id" value={employee.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Employee number"
              htmlFor={fieldId("employeeNo")}
              error={errors?.employeeNo}
            >
              <div className="relative">
                <Input
                  id={fieldId("employeeNo")}
                  name="employeeNo"
                  value={employeeNo}
                  onChange={(event) => setEmployeeNo(event.target.value)}
                  aria-invalid={invalid("employeeNo")}
                  className="pr-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                  aria-label="Generate employee number"
                  title="Generate employee number"
                  onClick={() => setEmployeeNo(generateEmployeeNumber())}
                >
                  <WandSparklesIcon />
                </Button>
              </div>
            </Field>

            <Field
              label="Status"
              htmlFor={fieldId("status")}
              error={errors?.status}
            >
              <Select name="status" defaultValue={employee?.status ?? "active"}>
                <SelectTrigger
                  id={fieldId("status")}
                  className="w-full"
                  aria-invalid={invalid("status")}
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="on_leave">on_leave</SelectItem>
                  <SelectItem value="inactive">inactive</SelectItem>
                  <SelectItem value="terminated">terminated</SelectItem>
                </SelectContent>
              </Select>
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
              <DatePicker
                id={fieldId("birthdate")}
                name="birthdate"
                defaultValue={employee?.birthdate}
                placeholder="Pick a birthdate"
                clearable
                invalid={invalid("birthdate")}
              />
            </Field>

            <Field
              label="Gender"
              htmlFor={fieldId("gender")}
              error={errors?.gender}
            >
              <Select
                name="gender"
                defaultValue={employee?.gender || NONE_VALUE}
              >
                <SelectTrigger
                  id={fieldId("gender")}
                  className="w-full"
                  aria-invalid={invalid("gender")}
                >
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>—</SelectItem>
                  <SelectItem value="male">male</SelectItem>
                  <SelectItem value="female">female</SelectItem>
                  <SelectItem value="other">other</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Phone"
              htmlFor={fieldId("phone")}
              error={errors?.phone}
            >
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
              <DatePicker
                id={fieldId("hireDate")}
                name="hireDate"
                defaultValue={employee?.hireDate}
                placeholder="Pick a hire date"
                clearable
                invalid={invalid("hireDate")}
              />
            </Field>

            <Field
              label="Department"
              htmlFor={fieldId("departmentId")}
              error={errors?.departmentId}
            >
              <Select
                name="departmentId"
                defaultValue={employee?.departmentId || NONE_VALUE}
              >
                <SelectTrigger
                  id={fieldId("departmentId")}
                  className="w-full"
                  aria-invalid={invalid("departmentId")}
                >
                  <SelectValue placeholder="— None —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>— None —</SelectItem>
                  {departments.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Position"
              htmlFor={fieldId("positionId")}
              error={errors?.positionId}
            >
              <Select
                name="positionId"
                defaultValue={employee?.positionId || NONE_VALUE}
              >
                <SelectTrigger
                  id={fieldId("positionId")}
                  className="w-full"
                  aria-invalid={invalid("positionId")}
                >
                  <SelectValue placeholder="— None —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>— None —</SelectItem>
                  {positions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Manager"
              htmlFor={fieldId("managerId")}
              error={errors?.managerId}
            >
              <Select
                name="managerId"
                defaultValue={employee?.managerId || NONE_VALUE}
              >
                <SelectTrigger
                  id={fieldId("managerId")}
                  className="w-full"
                  aria-invalid={invalid("managerId")}
                >
                  <SelectValue placeholder="— None —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>— None —</SelectItem>
                  {managers.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Linked user account"
              htmlFor={fieldId("userId")}
              error={errors?.userId}
            >
              <Select
                name="userId"
                defaultValue={employee?.userId || NONE_VALUE}
              >
                <SelectTrigger
                  id={fieldId("userId")}
                  className="w-full"
                  aria-invalid={invalid("userId")}
                >
                  <SelectValue placeholder="— None —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>— None —</SelectItem>
                  {users.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving..."
                : employee
                  ? "Save changes"
                  : "Add employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
