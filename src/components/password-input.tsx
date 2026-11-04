"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

export function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  invalid = false,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  invalid?: boolean;
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
