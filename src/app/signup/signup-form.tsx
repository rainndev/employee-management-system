"use client";

import { useActionState, useId, useState } from "react";
import {
  CheckCircle2Icon,
  CircleIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  LockIcon,
  MailIcon,
} from "lucide-react";
import { signup } from "@/app/actions/auth";
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

const PASSWORD_CHECKS = [
  {
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  {
    label: "At least one letter",
    test: (value: string) => /[a-zA-Z]/.test(value),
  },
  {
    label: "At least one number",
    test: (value: string) => /[0-9]/.test(value),
  },
];

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);
  const [email, setEmail] = useState("");
  const [emailEdited, setEmailEdited] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  const emailErrors = emailEdited ? undefined : state?.errors?.email;
  const passwordIsValid = PASSWORD_CHECKS.every((check) =>
    check.test(password)
  );
  const passwordInvalid =
    password.length > 0 ? !passwordIsValid : Boolean(state?.errors?.password);

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
              autoComplete="new-password"
              placeholder="Create a password"
              required
              aria-invalid={passwordInvalid}
              aria-describedby={fieldId("password-hint")}
              className="h-10"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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

          <div id={fieldId("password-hint")} className="text-xs">
            {password.length === 0 ? (
              <p className="text-muted-foreground">
                Use 8 or more characters, including a letter and a number.
              </p>
            ) : passwordIsValid ? (
              <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2Icon className="size-3.5 shrink-0" />
                Password meets all requirements.
              </p>
            ) : (
              <ul className="grid gap-1.5">
                {PASSWORD_CHECKS.filter((check) => !check.test(password)).map(
                  (check) => (
                    <li
                      key={check.label}
                      className="flex items-center gap-1.5 text-muted-foreground"
                    >
                      <CircleIcon className="size-3 shrink-0" />
                      {check.label}
                    </li>
                  )
                )}
              </ul>
            )}
          </div>

          {password.length === 0 && (
            <FieldError>{state?.errors?.password?.[0]}</FieldError>
          )}
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
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}
