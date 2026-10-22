import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/dal";
import { canManage } from "@/lib/roles";
import { listPositions } from "@/lib/positions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deletePosition } from "./actions";
import { PositionForm } from "./forms";

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Positions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {manage
            ? "Create, rename, and remove job positions."
            : "Job positions in the organisation."}
        </p>
      </div>

      {manage && (
        <Card>
          <CardHeader>
            <CardTitle>Add position</CardTitle>
            <CardDescription>
              Titles must be unique among active positions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PositionForm />
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              {manage && <TableHead>Actions</TableHead>}
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
                  <TableCell>
                    <div className="flex flex-col items-start gap-2">
                      <details className="w-full">
                        <summary className="cursor-pointer text-sm underline">
                          Edit
                        </summary>
                        <div className="mt-3 w-72 rounded-lg border bg-muted/40 p-3">
                          <PositionForm position={position} />
                        </div>
                      </details>

                      <form action={deletePosition}>
                        <input type="hidden" name="id" value={position.id} />
                        <Button type="submit" variant="destructive" size="sm">
                          Delete
                        </Button>
                      </form>
                    </div>
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
