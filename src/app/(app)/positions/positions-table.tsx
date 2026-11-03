"use client";

import { useMemo } from "react";
import type { Position } from "@/lib/positions";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { PositionRowActions } from "./row-actions";

function getSearchText(position: Position) {
  return [position.title, position.description].filter(Boolean).join(" ");
}

export function PositionsTable({
  positions,
  manage,
}: {
  positions: Position[];
  manage: boolean;
}) {
  const columns = useMemo<DataTableColumn<Position>[]>(() => {
    const result: DataTableColumn<Position>[] = [
      {
        id: "title",
        accessorFn: (position) => position.title,
        header: "Title",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.title}</span>
        ),
      },
      {
        id: "description",
        accessorFn: (position) => position.description ?? "",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.description ?? "—"}
          </span>
        ),
      },
    ];

    if (manage) {
      result.push({
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-right">
            <PositionRowActions position={row.original} />
          </div>
        ),
      });
    }

    return result;
  }, [manage]);

  return (
    <DataTable
      data={positions}
      columns={columns}
      getSearchText={getSearchText}
      searchPlaceholder="Search positions..."
      emptyMessage="No positions match your search."
    />
  );
}
