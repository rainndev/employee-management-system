import { format } from "date-fns";
import { ArrowRightIcon } from "lucide-react";

function toDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function DateRange({
  start,
  end,
  layout = "stacked",
}: {
  start: string;
  end: string;
  layout?: "stacked" | "inline";
}) {
  if (start === end) {
    return (
      <span className="text-sm whitespace-nowrap">
        {format(toDate(start), "MMM d, yyyy")}
      </span>
    );
  }

  if (layout === "inline") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 text-sm whitespace-nowrap">
        <span className="font-medium">
          {format(toDate(start), "MMM d, yyyy")}
        </span>
        <ArrowRightIcon className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">
          {format(toDate(end), "MMM d, yyyy")}
        </span>
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 whitespace-nowrap">
      <span className="text-sm font-medium">
        {format(toDate(start), "MMM d, yyyy")}
      </span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowRightIcon className="size-3" />
        {format(toDate(end), "MMM d, yyyy")}
      </span>
    </div>
  );
}
