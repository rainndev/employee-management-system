"use client";

import { useActionState, useId, useState } from "react";
import { toast } from "sonner";
import type { Department } from "@/lib/departments";
import type { ActionState } from "@/lib/definitions";
import { saveDepartment } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, FormFeedback } from "@/components/form-feedback";

export function DepartmentForm({
  department,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  department?: Department;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [visibleState, setVisibleState] = useState<ActionState>(undefined);
  const [, action, pending] = useActionState<ActionState, FormData>(
    async (previous, formData) => {
      const next = await saveDepartment(previous, formData);
      setVisibleState(next);
      if (next?.success) {
        setOpen(false);
        toast.success(department ? "Department updated" : "Department created");
      } else if (next?.message) {
        toast.error(next.message);
      } else if (next?.errors) {
        toast.error("Please fix the highlighted fields.");
      }
      return next;
    },
    undefined
  );
  const nameId = useId();
  const descriptionId = useId();

  function handleOpenChange(next: boolean) {
    if (next) {
      setVisibleState(undefined);
    }

    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button
            variant={department ? "outline" : "default"}
            size={department ? "sm" : "default"}
          >
            {department ? "Edit" : "Add department"}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {department ? "Edit department" : "Add department"}
          </DialogTitle>
          <DialogDescription>
            Names must be unique among active departments.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-4">
          {department && (
            <input type="hidden" name="id" value={department.id} />
          )}

          <div className="grid gap-2">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              name="name"
              defaultValue={department?.name}
              aria-invalid={Boolean(visibleState?.errors?.name)}
            />
            <FieldError messages={visibleState?.errors?.name} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={descriptionId}>Description</Label>
            <Textarea
              id={descriptionId}
              name="description"
              defaultValue={department?.description ?? ""}
              placeholder="e.g. Keeps day-to-day business processes running smoothly across teams and locations."
              aria-invalid={Boolean(visibleState?.errors?.description)}
            />
            <FieldError messages={visibleState?.errors?.description} />
          </div>

          <FormFeedback state={visibleState} />

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving..."
                : department
                  ? "Save changes"
                  : "Add department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
