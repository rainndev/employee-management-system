import Link from "next/link";
import type { LeaveRequestItem } from "@/lib/leave";
import { Button } from "@/components/ui/button";
import { DateRange } from "@/components/date-range";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const VISIBLE_REQUESTS = 5;

export function PendingLeaveTable({
  requests,
  title = "Pending approvals",
  description = "Requests waiting for a decision.",
  emptyMessage = "No pending leave requests.",
  viewAllHref = "/leave",
}: {
  requests: LeaveRequestItem[];
  title?: string;
  description?: string;
  emptyMessage?: string;
  viewAllHref?: string;
}) {
  const visible = requests.slice(0, VISIBLE_REQUESTS);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href={viewAllHref}>View all</Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader className="[&_th]:text-muted-foreground">
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}

            {visible.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {request.employeeName}
                </TableCell>
                <TableCell>{request.leaveType}</TableCell>
                <TableCell>
                  <DateRange start={request.startDate} end={request.endDate} />
                </TableCell>
                <TableCell>{request.days}</TableCell>
                <TableCell>
                  <StatusBadge status={request.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
