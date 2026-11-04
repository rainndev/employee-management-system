"use client";

import { Label, Pie, PieChart } from "recharts";
import type { LeaveBalanceItem } from "@/lib/leave";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const dayFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function formatDays(value: number) {
  return dayFormatter.format(value);
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">
        {formatDays(value)}
      </p>
    </div>
  );
}

export function LeaveBalanceChart({
  data,
  year,
}: {
  data: LeaveBalanceItem[];
  year: number;
}) {
  // Uncapped types (allocated = 0, e.g. unpaid) are not part of the allowance
  // donut but still appear in the summary note.
  const capped = data.filter((item) => item.allocated > 0);

  const chartConfig: ChartConfig = Object.fromEntries(
    capped.map((item, index) => [
      `type${index}`,
      {
        label: item.leaveType,
        color: `var(--chart-${(index % 5) + 1})`,
      },
    ])
  );

  const chartData = capped.map((item, index) => ({
    key: `type${index}`,
    leaveType: item.leaveType,
    allocated: item.allocated,
    available: item.available ?? 0,
    fill: `var(--color-type${index})`,
  }));

  const totals = capped.reduce(
    (acc, item) => ({
      allocated: acc.allocated + item.allocated,
      used: acc.used + item.used,
      pending: acc.pending + item.pending,
      available: acc.available + (item.available ?? 0),
    }),
    { allocated: 0, used: 0, pending: 0, available: 0 }
  );

  const hasUncapped = data.some((item) => item.allocated <= 0);
  const overAllocated = capped.filter((item) => item.used > item.allocated);
  const overAllocatedDays = overAllocated.reduce(
    (total, item) => total + (item.used - item.allocated),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave balance</CardTitle>
        <CardDescription>
          Your {year} leave allowance across leave types.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <SummaryTile label="Allocated" value={totals.allocated} />
              <SummaryTile label="Used" value={totals.used} />
              <SummaryTile label="Pending" value={totals.pending} />
            </div>

            {overAllocated.length > 0 && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                Used leave exceeds the allocation by{" "}
                {formatDays(overAllocatedDays)}{" "}
                {overAllocatedDays === 1 ? "day" : "days"}. Contact HR to
                reconcile the balance.
              </p>
            )}

            <div className="grid gap-2">
              {capped.map((item, index) => (
                <div
                  key={item.leaveTypeId}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-[2px]"
                      style={{
                        backgroundColor: `var(--chart-${(index % 5) + 1})`,
                      }}
                    />
                    <span className="truncate">{item.leaveType}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatDays(item.available ?? 0)}
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      / {formatDays(item.allocated)}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            {hasUncapped && (
              <p className="text-xs text-muted-foreground">
                Unpaid leave is tracked but has no yearly cap.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {chartData.length > 0 ? (
              <>
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square max-h-[260px] w-full"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel nameKey="key" />}
                    />
                    <Pie
                      data={chartData}
                      dataKey="allocated"
                      nameKey="key"
                      innerRadius={65}
                      strokeWidth={5}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (
                            !viewBox ||
                            !("cx" in viewBox) ||
                            !("cy" in viewBox)
                          ) {
                            return null;
                          }

                          const cx = Number(viewBox.cx);
                          const cy = Number(viewBox.cy);

                          if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
                            return null;
                          }

                          return (
                            <text
                              x={cx}
                              y={cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={cx}
                                y={cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {formatDays(totals.available)}
                              </tspan>
                              <tspan
                                x={cx}
                                y={cy + 24}
                                className="fill-muted-foreground"
                              >
                                days left
                              </tspan>
                            </text>
                          );
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>

                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                  {chartData.map((item, index) => (
                    <span
                      key={item.key}
                      className="flex items-center gap-1.5 text-sm"
                    >
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-[2px]"
                        style={{
                          backgroundColor: `var(--chart-${(index % 5) + 1})`,
                        }}
                      />
                      <span className="text-muted-foreground">
                        {item.leaveType}
                      </span>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No leave allowances are configured yet.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
