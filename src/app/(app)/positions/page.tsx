import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/dal";
import { canManage } from "@/lib/roles";
import { listPositions } from "@/lib/positions";
import { PositionForm } from "./forms";
import { PositionsTable } from "./positions-table";

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
        <PositionsTable positions={positions} manage={manage} />
      </div>
    </div>
  );
}
