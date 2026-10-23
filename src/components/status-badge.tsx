import { Badge } from "@/components/ui/badge";
import {
  CheckIcon,
  HourglassIcon,
  MinusIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";

type StatusMeta = {
  label: string;
  icon: LucideIcon;
  tone: string;
};

const STATUS_META: Record<string, StatusMeta> = {
  approved: {
    label: "Approved",
    icon: CheckIcon,
    tone: "bg-emerald-400 text-white",
  },
  active: {
    label: "Active",
    icon: CheckIcon,
    tone: "bg-emerald-400 text-white",
  },
  pending: {
    label: "Pending",
    icon: HourglassIcon,
    tone: "bg-amber-400 text-white",
  },
  on_leave: {
    label: "On leave",
    icon: HourglassIcon,
    tone: "bg-amber-400 text-white",
  },
  rejected: {
    label: "Rejected",
    icon: XIcon,
    tone: "bg-red-400 text-white",
  },
  terminated: {
    label: "Terminated",
    icon: XIcon,
    tone: "bg-red-400 text-white",
  },
  inactive: {
    label: "Inactive",
    icon: MinusIcon,
    tone: "bg-muted-foreground text-background",
  },
  cancelled: {
    label: "Cancelled",
    icon: MinusIcon,
    tone: "bg-muted-foreground text-background",
  },
};

const FALLBACK: StatusMeta = {
  label: "",
  icon: MinusIcon,
  tone: "bg-muted-foreground text-background",
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? FALLBACK;
  const Icon = meta.icon;

  return (
    <Badge
      variant="outline"
      className="h-6 gap-1.5 rounded-full pr-2.5 pl-1 font-medium"
    >
      <span
        className={`flex size-3 shrink-0 items-center justify-center rounded-full ${meta.tone}`}
      >
        <Icon className="size-1.5" strokeWidth={3} />
      </span>
      {meta.label || status}
    </Badge>
  );
}
