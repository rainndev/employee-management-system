import { format } from "date-fns";
import { ArrowRightIcon } from "lucide-react";

function toDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function DateRange({ start, end }: { start: string; end: string }) {
  if (start === end) {
    return (
      <span className="whitespace-nowrap">
        {format(toDate(start), "MMM d, yyyy")}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 whitespace-nowrap">
      <span className="text-sm font-medium">
        {format(toDate(start), "MMM d, yyyy")}
      </span>
      <span className="mt-1 flex w-fit items-center gap-1 rounded-full border px-2 py-1 text-xs text-muted-foreground">
        <ArrowRightIcon className="size-3" />
        {format(toDate(end), "MMM d, yyyy")}
      </span>
    </div>
  );
}
