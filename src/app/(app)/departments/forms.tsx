"use client";

import { useActionState, useId } from "react";
import type { Department } from "@/lib/departments";
import { saveDepartment } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, FormFeedback } from "@/components/form-feedback";

export function DepartmentForm({ department }: { department?: Department }) {
  const [state, action, pending] = useActionState(saveDepartment, undefined);
  const nameId = useId();
  const descriptionId = useId();

  return (
    <form action={action} className="flex flex-col gap-4">
      {department && <input type="hidden" name="id" value={department.id} />}

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

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : department ? "Save changes" : "Add department"}
      </Button>
    </form>
  );
}
