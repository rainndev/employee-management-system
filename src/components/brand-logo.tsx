import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  textClassName,
}: {
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <BrandMark className="size-4" />
      </span>
      <span
        className={cn("text-sm font-semibold tracking-tight", textClassName)}
      >
        CoreHR
      </span>
    </span>
  );
}
