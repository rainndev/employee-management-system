import { Badge } from "@/components/ui/badge";
import {
  CircleCheckIcon,
  CircleMinusIcon,
  CircleXIcon,
  ClockIcon,
  type LucideIcon,
} from "lucide-react";

type StatusMeta = {
  label: string;
  icon: LucideIcon;
  iconClass: string;
};

const STATUS_META: Record<string, StatusMeta> = {
  approved: {
    label: "Approved",
    icon: CircleCheckIcon,
    iconClass: "fill-emerald-500 text-white",
  },
  active: {
    label: "Active",
    icon: CircleCheckIcon,
    iconClass: "fill-emerald-500 text-white",
  },
  pending: {
    label: "Pending",
    icon: ClockIcon,
    iconClass: "fill-amber-500 text-white",
  },
  on_leave: {
    label: "On leave",
    icon: ClockIcon,
    iconClass: "fill-amber-500 text-white",
  },
  rejected: {
    label: "Rejected",
    icon: CircleXIcon,
    iconClass: "fill-red-500 text-white",
  },
  terminated: {
    label: "Terminated",
    icon: CircleXIcon,
    iconClass: "fill-red-500 text-white",
  },
  inactive: {
    label: "Inactive",
    icon: CircleMinusIcon,
    iconClass: "fill-muted-foreground text-background",
  },
  cancelled: {
    label: "Cancelled",
    icon: CircleMinusIcon,
    iconClass: "fill-muted-foreground text-background",
  },
};

const FALLBACK: StatusMeta = {
  label: "",
  icon: CircleMinusIcon,
  iconClass: "fill-muted-foreground text-background",
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? FALLBACK;
  const Icon = meta.icon;

  return (
    <Badge
      variant="outline"
      className="h-6 gap-1.5 rounded-full px-3 font-medium"
    >
      <Icon className={`size-4 ${meta.iconClass}`} />
      {meta.label || status}
    </Badge>
  );
}
