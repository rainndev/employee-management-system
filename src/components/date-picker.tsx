"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function parseISODate(value?: string) {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(year, month - 1, day);
}

export function DatePicker({
  name,
  id,
  defaultValue,
  value: controlledValue,
  onValueChange,
  placeholder = "Pick a date",
  clearable = false,
  invalid = false,
}: {
  name: string;
  id?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
  clearable?: boolean;
  invalid?: boolean;
}) {
  const [internalDate, setInternalDate] = useState<Date | undefined>(() =>
    parseISODate(defaultValue)
  );
  const isControlled = controlledValue !== undefined;
  const date = isControlled ? parseISODate(controlledValue) : internalDate;
  const [open, setOpen] = useState(false);

  function setDate(next: Date | undefined) {
    if (!isControlled) {
      setInternalDate(next);
    }
    onValueChange?.(next ? format(next, "yyyy-MM-dd") : undefined);
  }

  return (
    <>
      <input
        type="hidden"
        name={name}
        value={date ? format(date, "yyyy-MM-dd") : ""}
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={invalid}
            className={cn(
              "w-full justify-start gap-2 font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon />
            {date ? format(date, "MMM d, yyyy") : placeholder}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(next) => {
              setDate(next);
              setOpen(false);
            }}
            autoFocus
          />

          {clearable && date && (
            <div className="border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setDate(undefined);
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
