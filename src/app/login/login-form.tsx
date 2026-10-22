"use client";

import { useActionState, useId } from "react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormFeedback } from "@/components/form-feedback";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
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
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state?.errors?.password)}
        />
        <FieldError messages={state?.errors?.password} />
      </div>

      <FormFeedback state={state} />

      <Button type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
