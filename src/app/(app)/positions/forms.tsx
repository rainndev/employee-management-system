"use client";

import { useActionState, useId } from "react";
import type { Position } from "@/lib/positions";
import { savePosition } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, FormFeedback } from "@/components/form-feedback";

export function PositionForm({ position }: { position?: Position }) {
  const [state, action, pending] = useActionState(savePosition, undefined);
  const titleId = useId();
  const descriptionId = useId();

  return (
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

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : position ? "Save changes" : "Add position"}
      </Button>
    </form>
  );
}
