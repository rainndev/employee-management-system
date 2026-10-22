"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SignupPoint } from "@/lib/admin";

const chartConfig = {
  users: {
    label: "Joined users",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

// `short` is shown on mobile where "Last " is hidden to save width.
const RANGES = [
  { value: "90", short: "3 months" },
  { value: "30", short: "30 days" },
  { value: "7", short: "7 days" },
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00`));
}

export function SignupsChart({ data }: { data: SignupPoint[] }) {
  const [range, setRange] = useState("7");
  const days = Number(range);

  const series = useMemo(() => data.slice(-days), [data, days]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-1">
            <CardTitle>Joined users</CardTitle>
            <CardDescription>
              Accounts created over the last {days} days
            </CardDescription>
          </div>

          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={range}
            onValueChange={(value) => value && setRange(value)}
            className="w-full sm:w-auto"
          >
            {RANGES.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className="flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">Last&nbsp;</span>
                {option.short}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[220px] w-full sm:h-[260px]"
        >
          <AreaChart data={series} margin={{ left: 4, right: 8, top: 4 }}>
            <defs>
              <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-users)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-users)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={formatDate}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) => formatDate(String(value))}
                />
              }
            />
            <Area
              dataKey="users"
              type="natural"
              fill="url(#fillUsers)"
              stroke="var(--color-users)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
