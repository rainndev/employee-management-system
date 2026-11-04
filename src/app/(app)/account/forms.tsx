"use client";

import { useActionState, useId, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "sonner";
import type { AccountPasswordState } from "@/lib/definitions";
import { changePassword } from "./actions";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { FieldError, FormFeedback } from "@/components/form-feedback";

function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  invalid,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  invalid: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup className="h-10 w-full">
      <InputGroupInput
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        aria-invalid={invalid}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-sm"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={visible}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

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
    <form action={action} className="flex w-full max-w-md flex-col gap-4">
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
      </Field>

      <Field
        label="New password"
        htmlFor={fieldId("password")}
        error={state?.errors?.password}
      >
        <PasswordInput
          id={fieldId("password")}
          name="password"
          label="new password"
          autoComplete="new-password"
          invalid={Boolean(state?.errors?.password)}
        />
      </Field>

      <Field
        label="Confirm new password"
        htmlFor={fieldId("confirmPassword")}
        error={state?.errors?.confirmPassword}
      >
        <PasswordInput
          id={fieldId("confirmPassword")}
          name="confirmPassword"
          label="confirm password"
          autoComplete="new-password"
          invalid={Boolean(state?.errors?.confirmPassword)}
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
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Updating..." : "Update password"}
        </Button>
      </div>
    </form>
  );
}
