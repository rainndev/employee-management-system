"use client";

import { useActionState, useId, useState } from "react";
import {
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  LockIcon,
  MailIcon,
} from "lucide-react";
import { login } from "@/app/actions/auth";
import { FormFeedback } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const [email, setEmail] = useState("");
  const [emailEdited, setEmailEdited] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  const emailErrors = emailEdited ? undefined : state?.errors?.email;
  const passwordInvalid =
    password.length === 0 && Boolean(state?.errors?.password);

  return (
    <form
      action={action}
      onSubmit={() => setEmailEdited(false)}
      className="flex flex-col gap-5"
    >
      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(emailErrors)}>
          <FieldLabel htmlFor={fieldId("email")}>Email</FieldLabel>
          <InputGroup className="h-10">
            <InputGroupAddon>
              <MailIcon />
            </InputGroupAddon>
            <InputGroupInput
              id={fieldId("email")}
              name="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@company.com"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailEdited(true);
              }}
              aria-invalid={Boolean(emailErrors)}
              aria-describedby={
                emailErrors ? fieldId("email-error") : undefined
              }
              className="h-10"
            />
          </InputGroup>
          <FieldError id={fieldId("email-error")}>
            {emailErrors?.[0]}
          </FieldError>
        </Field>

        <Field data-invalid={passwordInvalid}>
          <FieldLabel htmlFor={fieldId("password")}>Password</FieldLabel>
          <InputGroup className="h-10">
            <InputGroupAddon>
              <LockIcon />
            </InputGroupAddon>
            <InputGroupInput
              id={fieldId("password")}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={passwordInvalid}
              aria-describedby={
                passwordInvalid ? fieldId("password-error") : undefined
              }
              className="h-10"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError id={fieldId("password-error")}>
            {passwordInvalid ? state?.errors?.password?.[0] : undefined}
          </FieldError>
        </Field>
      </FieldGroup>

      <FormFeedback state={state} />

      <Button
        type="submit"
        className="h-10 w-full"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? (
          <>
            <Loader2Icon className="animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
