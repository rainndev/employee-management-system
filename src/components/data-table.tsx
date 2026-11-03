"use client";

import { useMemo, useState } from "react";
import {
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type PaginationState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

export type DataTableColumn<T extends RowData> = ColumnDef<typeof features, T>;

export type DataTableFilter<T extends RowData> = {
  id: string;
  allLabel: string;
  options: { value: string; label: string }[];
  getValue: (row: T) => string;
};

const ALL = "all";
const PAGE_SIZES = [10, 20, 50];
const EMPTY_FILTERS: DataTableFilter<RowData>[] = [];

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") {
    return <ArrowUpIcon className="size-3.5" />;
  }

  if (direction === "desc") {
    return <ArrowDownIcon className="size-3.5" />;
  }

  return <ChevronsUpDownIcon className="size-3.5 opacity-50" />;
}

export function DataTable<T extends RowData>({
  data,
  columns,
  getSearchText,
  searchPlaceholder = "Search...",
  filters = EMPTY_FILTERS,
  emptyMessage = "No records found.",
  initialPageSize = 10,
}: {
  data: T[];
  columns: DataTableColumn<T>[];
  getSearchText: (row: T) => string;
  searchPlaceholder?: string;
  filters?: DataTableFilter<T>[];
  emptyMessage?: string;
  initialPageSize?: number;
}) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.filter((row) => {
      if (query && !getSearchText(row).toLowerCase().includes(query)) {
        return false;
      }

      return filters.every((filter) => {
        const value = filterValues[filter.id];

        return !value || value === ALL || filter.getValue(row) === value;
      });
    });
  }, [data, filters, filterValues, getSearchText, search]);

  const table = useTable({
    features,
    data: filteredData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    autoResetPageIndex: true,
  });

  const rows = table.getRowModel().rows;
  const totalRows = table.getPrePaginatedRowModel().rows.length;
  const pageCount = Math.max(table.getPageCount(), 1);
  const pageIndex = pagination.pageIndex;
  const firstRow = totalRows === 0 ? 0 : pageIndex * pagination.pageSize + 1;
  const lastRow = Math.min(firstRow + pagination.pageSize - 1, totalRows);
  const hasActiveQuery =
    search.trim().length > 0 ||
    Object.values(filterValues).some((value) => value !== ALL);

  function resetPage() {
    setPagination((current) =>
      current.pageIndex === 0 ? current : { ...current, pageIndex: 0 }
    );
  }

  function clearQuery() {
    setSearch("");
    setFilterValues({});
    resetPage();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetPage();
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-8"
          />
        </div>

        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <Select
                key={filter.id}
                value={filterValues[filter.id] ?? ALL}
                onValueChange={(value) => {
                  setFilterValues((current) => ({
                    ...current,
                    [filter.id]: value,
                  }));
                  resetPage();
                }}
              >
                <SelectTrigger size="sm" aria-label={filter.allLabel}>
                  <SelectValue placeholder={filter.allLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{filter.allLabel}</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}

            {hasActiveQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearQuery}
              >
                <XIcon />
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      <Table>
        <TableHeader className="[&_th]:text-muted-foreground">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();

                return (
                  <TableHead
                    key={header.id}
                    aria-sort={
                      !canSort
                        ? undefined
                        : sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : "none"
                    }
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={(event) =>
                          header.column
                            .getToggleSortingHandler()
                            ?.call(header.column, event)
                        }
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                      >
                        <table.FlexRender header={header} />
                        <SortIcon direction={sorted} />
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}

          {rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 border-t pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          {totalRows === 0
            ? "No results"
            : `Showing ${firstRow}–${lastRow} of ${totalRows}`}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">Rows per page</span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
              resetPage();
            }}
          >
            <SelectTrigger size="sm" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-muted-foreground">
            Page {pageIndex + 1} of {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
