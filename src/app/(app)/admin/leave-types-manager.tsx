"use client";

import { useActionState, useId, useState, useTransition } from "react";
import {
  EllipsisVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminLeaveType } from "@/lib/leave-types";
import type { ActionState } from "@/lib/definitions";
import { NONE_VALUE } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DropdownSelect } from "@/components/dropdown-select";
import { FieldError, FormFeedback } from "@/components/form-feedback";
import { deleteLeaveType, saveLeaveType } from "./leave-type-actions";

const GENDER_OPTIONS = [
  { value: NONE_VALUE, label: "All genders" },
  { value: "female", label: "Female only" },
  { value: "male", label: "Male only" },
];

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <FieldError messages={error} />
    </div>
  );
}

function LeaveTypeForm({
  leaveType,
  open,
  onOpenChange,
}: {
  leaveType?: AdminLeaveType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [visibleState, setVisibleState] = useState<ActionState>(undefined);
  const [, action, pending] = useActionState<ActionState, FormData>(
    async (previous, formData) => {
      const next = await saveLeaveType(previous, formData);
      setVisibleState(next);

      if (next?.success) {
        toast.success(leaveType ? "Leave type updated" : "Leave type created");
        onOpenChange(false);
      } else if (next?.message) {
        toast.error(next.message);
      } else if (next?.errors) {
        toast.error("Please fix the highlighted fields.");
      }

      return next;
    },
    undefined
  );
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setVisibleState(undefined);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {leaveType ? "Edit leave type" : "New leave type"}
          </DialogTitle>
          <DialogDescription>
            Custom types appear in the leave request form for every employee.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-4">
          {leaveType && <input type="hidden" name="id" value={leaveType.id} />}

          <Field
            label="Name"
            htmlFor={fieldId("name")}
            error={visibleState?.errors?.name}
          >
            <Input
              id={fieldId("name")}
              name="name"
              defaultValue={leaveType?.name ?? ""}
              placeholder="e.g. Bereavement"
              aria-invalid={Boolean(visibleState?.errors?.name)}
            />
          </Field>

          <Field
            label="Max allocated days per year"
            htmlFor={fieldId("defaultDays")}
            error={visibleState?.errors?.defaultDays}
          >
            <Input
              id={fieldId("defaultDays")}
              name="defaultDays"
              type="number"
              min={0}
              max={999}
              step={1}
              defaultValue={leaveType?.defaultDays ?? 0}
              aria-invalid={Boolean(visibleState?.errors?.defaultDays)}
            />
          </Field>

          <Field
            label="Gender eligibility"
            htmlFor={fieldId("eligibleGender")}
            error={visibleState?.errors?.eligibleGender}
          >
            <DropdownSelect
              id={fieldId("eligibleGender")}
              name="eligibleGender"
              defaultValue={leaveType?.eligibleGender || NONE_VALUE}
              options={GENDER_OPTIONS}
              placeholder="All genders"
              ariaInvalid={Boolean(visibleState?.errors?.eligibleGender)}
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isPaid"
              defaultChecked={leaveType?.isPaid ?? true}
              className="size-4 accent-primary"
            />
            Paid leave
          </label>

          <FormFeedback state={visibleState} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving..."
                : leaveType
                  ? "Save leave type"
                  : "Add leave type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LeaveTypesManager({
  leaveTypes,
}: {
  leaveTypes: AdminLeaveType[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminLeaveType | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<AdminLeaveType | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Leave types</CardTitle>
          <CardDescription>
            Create custom allowances that employees can file against.
          </CardDescription>
          <CardAction>
            <Button
              size="sm"
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
            >
              <PlusIcon />
              New leave type
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader className="[&_th]:text-muted-foreground">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Max allocated</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveTypes.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No active leave types.
                  </TableCell>
                </TableRow>
              )}

              {leaveTypes.map((leaveType) => (
                <TableRow key={leaveType.id}>
                  <TableCell className="font-medium">
                    {leaveType.name}
                  </TableCell>
                  <TableCell>{leaveType.defaultDays}</TableCell>
                  <TableCell className="capitalize">
                    {leaveType.eligibleGender ?? "All genders"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={leaveType.isPaid ? "secondary" : "outline"}>
                      {leaveType.isPaid ? "Paid" : "Unpaid"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {leaveType.requestCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Leave type actions"
                        >
                          <EllipsisVerticalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(leaveType);
                            setFormOpen(true);
                          }}
                        >
                          <PencilIcon />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleteTarget(leaveType)}
                        >
                          <Trash2Icon />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {formOpen && (
        <LeaveTypeForm leaveType={editing} open onOpenChange={setFormOpen} />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete this leave type?"
        description={
          <>
            {deleteTarget?.name} will no longer appear in the leave request
            form. Existing requests keep their type and history.
          </>
        }
        confirmLabel="Delete leave type"
        pending={pending}
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          startTransition(async () => {
            const result = await deleteLeaveType(deleteTarget.id);

            if (!result.success) {
              toast.error(result.message ?? "Could not delete the leave type.");
              return;
            }

            toast.success("Leave type deleted");
            setDeleteTarget(null);
          });
        }}
      />
    </>
  );
}
