import Link from "next/link";
import type { LeaveRequestItem } from "@/lib/leave";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function statusVariant(status: string) {
  if (status === "approved") {
    return "default" as const;
  }
  if (status === "rejected") {
    return "destructive" as const;
  }
  return "secondary" as const;
}

export function MyLeaveTable({
  requests,
  emptyMessage = "No leave requests yet.",
}: {
  requests: LeaveRequestItem[];
  emptyMessage?: string;
}) {
  const visible = requests.slice(0, VISIBLE_REQUESTS);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My leave requests</CardTitle>
        <CardDescription>Your latest leave requests.</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href="/leave">View all</Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader className="[&_th]:text-muted-foreground">
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approver</TableHead>
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
                  {request.leaveType}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {request.startDate} → {request.endDate}
                </TableCell>
                <TableCell>{request.days}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(request.status)}>
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {request.approverName ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
