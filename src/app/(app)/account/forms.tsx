"use client";

import { useActionState, useId } from "react";
import { toast } from "sonner";
import type { AccountPasswordState } from "@/lib/definitions";
import { changePassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<
    AccountPasswordState,
    FormData
  >(async (previous, formData) => {
    const next = await changePassword(previous, formData);

    if (next?.success) {
      toast.success("Password updated");
    } else if (next?.message) {
      toast.error(next.message);
    } else if (next?.errors) {
      toast.error("Please fix the highlighted fields.");
    }

    return next;
  }, undefined);
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      <Field
        label="Current password"
        htmlFor={fieldId("currentPassword")}
        error={state?.errors?.currentPassword}
      >
        <Input
          id={fieldId("currentPassword")}
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(state?.errors?.currentPassword)}
        />
      </Field>

      <Field
        label="New password"
        htmlFor={fieldId("password")}
        error={state?.errors?.password}
      >
        <Input
          id={fieldId("password")}
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(state?.errors?.password)}
        />
      </Field>

      <Field
        label="Confirm new password"
        htmlFor={fieldId("confirmPassword")}
        error={state?.errors?.confirmPassword}
      >
        <Input
          id={fieldId("confirmPassword")}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(state?.errors?.confirmPassword)}
        />
      </Field>

      <p className="text-sm text-muted-foreground">
        Use 8 or more characters, including a letter and a number. Changing your
        password signs out every other active session.
      </p>

      {state?.success && state.message && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {state.message}
        </p>
      )}

      {!state?.success && <FormFeedback state={state} />}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Updating..." : "Update password"}
        </Button>
      </div>
    </form>
  );
}
