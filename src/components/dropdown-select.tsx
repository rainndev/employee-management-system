"use client";

import { useId, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type DropdownSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export function DropdownSelect({
  name,
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder = "Select an option",
  unavailableLabel = "Unavailable selection",
  id,
  ariaLabel,
  ariaInvalid = false,
  disabled = false,
  size = "default",
  className,
  contentClassName,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: DropdownSelectOption[];
  placeholder?: string;
  unavailableLabel?: string;
  id?: string;
  ariaLabel?: string;
  ariaInvalid?: boolean;
  disabled?: boolean;
  size?: "sm" | "default";
  className?: string;
  contentClassName?: string;
}) {
  const generatedId = useId();
  const [internalValue, setInternalValue] = useState(
    value ?? defaultValue ?? ""
  );
  const currentValue = value ?? internalValue;
  const missingCurrent =
    currentValue !== "" &&
    !options.some((option) => option.value === currentValue);
  const effectiveOptions = missingCurrent
    ? [
        {
          value: currentValue,
          label: unavailableLabel,
          disabled: true,
        },
        ...options,
      ]
    : options;
  const selected = effectiveOptions.find(
    (option) => option.value === currentValue
  );

  function select(next: string) {
    if (value === undefined) {
      setInternalValue(next);
    }

    onValueChange?.(next);
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={currentValue} />}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            id={id ?? generatedId}
            type="button"
            variant="outline"
            size={size}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid || undefined}
            className={cn(
              "w-full justify-between gap-2 font-normal",
              !selected && "text-muted-foreground",
              className
            )}
          >
            <span className="truncate">{selected?.label ?? placeholder}</span>
            <ChevronDownIcon className="size-4 shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className={contentClassName}>
          {effectiveOptions.length === 0 ? (
            <DropdownMenuItem disabled>No options</DropdownMenuItem>
          ) : (
            <DropdownMenuRadioGroup value={currentValue} onValueChange={select}>
              {effectiveOptions.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
