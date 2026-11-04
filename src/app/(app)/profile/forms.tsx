"use client";

import { useActionState, useId, useState } from "react";
import { toast } from "sonner";
import type { MyProfile } from "@/lib/profile";
import { NONE_VALUE } from "@/lib/constants";
import type { ProfileState } from "@/lib/definitions";
import { saveProfile } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import { DropdownSelect } from "@/components/dropdown-select";
import { PasswordInput } from "@/components/password-input";
import { FieldError, FormFeedback } from "@/components/form-feedback";
import { StatusBadge } from "@/components/status-badge";

const GENDER_OPTIONS = [
  { value: NONE_VALUE, label: "—" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

function Field({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="grid gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {children}
        <FieldError messages={error} />
      </div>
    </div>
  );
}

function ReadOnlyItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

export function ProfileForm({ profile }: { profile: MyProfile }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    async (previous, formData) => {
      const next = await saveProfile(previous, formData);

      if (next?.success) {
        toast.success("Profile updated");
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
  const employee = profile.employee;
  const [email, setEmail] = useState(profile.email);
  const [firstName, setFirstName] = useState(employee?.firstName ?? "");
  const [lastName, setLastName] = useState(employee?.lastName ?? "");
  const [phone, setPhone] = useState(employee?.phone ?? "");
  const [birthdate, setBirthdate] = useState(employee?.birthdate ?? "");
  const [gender, setGender] = useState(employee?.gender || NONE_VALUE);
  const [address, setAddress] = useState(employee?.address ?? "");

  return (
    <form action={action} className="flex w-full flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Update your sign-in email or password. Changing your email requires
            your current password.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field
            label="Email"
            htmlFor={fieldId("email")}
            error={state?.errors?.email}
          >
            <Input
              id={fieldId("email")}
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(state?.errors?.email)}
            />
          </Field>

          <div className="grid gap-2">
            <Label>Role</Label>
            <div>
              <Badge variant="secondary" className="capitalize">
                {profile.role}
              </Badge>
            </div>
          </div>

          <Field
            label="Current password"
            htmlFor={fieldId("currentPassword")}
            error={state?.errors?.currentPassword}
          >
            <PasswordInput
              id={fieldId("currentPassword")}
              name="currentPassword"
              label="current password"
              autoComplete="current-password"
              invalid={Boolean(state?.errors?.currentPassword)}
            />
            <p className="text-xs text-muted-foreground">
              Only required when changing your sign-in email.
            </p>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee profile</CardTitle>
          <CardDescription>
            {employee
              ? "These details are visible in the employee directory."
              : "Your account is not linked to an employee record yet."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {employee ? (
            <div className="flex flex-col gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="First name"
                  htmlFor={fieldId("firstName")}
                  error={state?.errors?.firstName}
                >
                  <Input
                    id={fieldId("firstName")}
                    name="firstName"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    aria-invalid={Boolean(state?.errors?.firstName)}
                  />
                </Field>

                <Field
                  label="Last name"
                  htmlFor={fieldId("lastName")}
                  error={state?.errors?.lastName}
                >
                  <Input
                    id={fieldId("lastName")}
                    name="lastName"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    aria-invalid={Boolean(state?.errors?.lastName)}
                  />
                </Field>

                <Field
                  label="Phone"
                  htmlFor={fieldId("phone")}
                  error={state?.errors?.phone}
                >
                  <Input
                    id={fieldId("phone")}
                    name="phone"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    aria-invalid={Boolean(state?.errors?.phone)}
                  />
                </Field>

                <Field
                  label="Birthdate"
                  htmlFor={fieldId("birthdate")}
                  error={state?.errors?.birthdate}
                >
                  <DatePicker
                    id={fieldId("birthdate")}
                    name="birthdate"
                    value={birthdate}
                    onValueChange={(value) => setBirthdate(value ?? "")}
                    placeholder="Pick a date"
                    clearable
                    invalid={Boolean(state?.errors?.birthdate)}
                  />
                </Field>

                <Field
                  label="Gender"
                  htmlFor={fieldId("gender")}
                  error={state?.errors?.gender}
                >
                  <DropdownSelect
                    id={fieldId("gender")}
                    name="gender"
                    value={gender}
                    onValueChange={setGender}
                    options={GENDER_OPTIONS}
                    placeholder="—"
                    ariaInvalid={Boolean(state?.errors?.gender)}
                  />
                </Field>

                <Field
                  label="Address"
                  htmlFor={fieldId("address")}
                  error={state?.errors?.address}
                  className="sm:col-span-2"
                >
                  <Textarea
                    id={fieldId("address")}
                    name="address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    aria-invalid={Boolean(state?.errors?.address)}
                  />
                </Field>
              </div>

              <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
                <ReadOnlyItem label="Employee no.">
                  {employee.employeeNo}
                </ReadOnlyItem>
                <ReadOnlyItem label="Department">
                  {employee.department ?? "—"}
                </ReadOnlyItem>
                <ReadOnlyItem label="Position">
                  {employee.position ?? "—"}
                </ReadOnlyItem>
                <ReadOnlyItem label="Manager">
                  {employee.managerName ?? "—"}
                </ReadOnlyItem>
                <ReadOnlyItem label="Hire date">
                  {employee.hireDate || "—"}
                </ReadOnlyItem>
                <ReadOnlyItem label="Status">
                  <StatusBadge status={employee.status} />
                </ReadOnlyItem>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ask an administrator to link your account to an employee record
              from Employees → Add employee → Linked user account.
            </p>
          )}
        </CardContent>
      </Card>

      {state?.success && state.message && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {state.message}
        </p>
      )}

      {!state?.success && <FormFeedback state={state} />}

      <div>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
