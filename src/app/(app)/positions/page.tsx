import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/dal";
import { canManage } from "@/lib/roles";
import { listPositions } from "@/lib/positions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PositionForm } from "./forms";
import { PositionRowActions } from "./row-actions";

export const metadata: Metadata = {
  title: "Positions",
};

export default function PositionsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
      >
        <Content />
      </Suspense>
    </main>
  );
}

async function Content() {
  const user = await requireUser();
  const positions = await listPositions();
  const manage = canManage(user.role);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Positions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {manage
              ? "Create, rename, and remove job positions."
              : "Job positions in the organisation."}
          </p>
        </div>
        {manage && <PositionForm />}
      </div>

      <div className="overflow-hidden rounded-xl border p-4">
        <Table>
          <TableHeader className="[&_th]:text-muted-foreground">
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              {manage && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={manage ? 3 : 2}
                  className="text-muted-foreground"
                >
                  No positions yet.
                </TableCell>
              </TableRow>
            )}

            {positions.map((position) => (
              <TableRow key={position.id}>
                <TableCell className="font-medium">{position.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {position.description ?? "—"}
                </TableCell>
                {manage && (
                  <TableCell className="text-right">
                    <PositionRowActions position={position} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
