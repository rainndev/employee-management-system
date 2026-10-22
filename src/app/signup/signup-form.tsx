"use client";

import { useActionState, useId } from "react";
import { signup } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormFeedback } from "@/components/form-feedback";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor={fieldId("email")}>Email</Label>
        <Input
          id={fieldId("email")}
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state?.errors?.email)}
        />
        <FieldError messages={state?.errors?.email} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={fieldId("password")}>Password</Label>
        <Input
          id={fieldId("password")}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(state?.errors?.password)}
        />
        <p className="text-xs text-muted-foreground">
          At least 8 characters, with a letter and a number.
        </p>
        <FieldError messages={state?.errors?.password} />
      </div>

      <FormFeedback state={state} />

      <Button type="submit" disabled={pending}>
        {pending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
