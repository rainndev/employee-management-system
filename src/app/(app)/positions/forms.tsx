"use client";

import { useActionState, useId, useState } from "react";
import type { Position } from "@/lib/positions";
import type { ActionState } from "@/lib/definitions";
import { savePosition } from "./actions";
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

export function PositionForm({ position }: { position?: Position }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (previous, formData) => {
      const next = await savePosition(previous, formData);
      if (next?.success) {
        setOpen(false);
      }
      return next;
    },
    undefined
  );
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={position ? "outline" : "default"}
          size={position ? "sm" : "default"}
        >
          {position ? "Edit" : "Add position"}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {position ? "Edit position" : "Add position"}
          </DialogTitle>
          <DialogDescription>
            Titles must be unique among active positions.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-4">
          {position && <input type="hidden" name="id" value={position.id} />}

          <div className="grid gap-2">
            <Label htmlFor={titleId}>Title</Label>
            <Input
              id={titleId}
              name="title"
              defaultValue={position?.title}
              aria-invalid={Boolean(state?.errors?.title)}
            />
            <FieldError messages={state?.errors?.title} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={descriptionId}>Description</Label>
            <Textarea
              id={descriptionId}
              name="description"
              defaultValue={position?.description ?? ""}
              aria-invalid={Boolean(state?.errors?.description)}
            />
            <FieldError messages={state?.errors?.description} />
          </div>

          <FormFeedback state={state} />

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving..."
                : position
                  ? "Save changes"
                  : "Add position"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
