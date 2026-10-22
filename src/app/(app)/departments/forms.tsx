"use client";

import { useActionState, useId, useState } from "react";
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

export function DepartmentForm({ department }: { department?: Department }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (previous, formData) => {
      const next = await saveDepartment(previous, formData);
      if (next?.success) {
        setOpen(false);
      }
      return next;
    },
    undefined
  );
  const nameId = useId();
  const descriptionId = useId();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={department ? "outline" : "default"}
          size={department ? "sm" : "default"}
        >
          {department ? "Edit" : "Add department"}
        </Button>
      </DialogTrigger>

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
              aria-invalid={Boolean(state?.errors?.name)}
            />
            <FieldError messages={state?.errors?.name} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={descriptionId}>Description</Label>
            <Textarea
              id={descriptionId}
              name="description"
              defaultValue={department?.description ?? ""}
              aria-invalid={Boolean(state?.errors?.description)}
            />
            <FieldError messages={state?.errors?.description} />
          </div>

          <FormFeedback state={state} />

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
