import Link from "next/link";
import type { EmployeeDirectoryItem } from "@/lib/employees";
import { StatusBadge } from "@/components/status-badge";
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

const VISIBLE_EMPLOYEES = 5;

export function EmployeesTableCard({
  employees,
  title = "Employees",
  description = "Your employee directory.",
  emptyMessage = "No employees yet.",
  viewAllHref = "/employees",
}: {
  employees: EmployeeDirectoryItem[];
  title?: string;
  description?: string;
  emptyMessage?: string;
  viewAllHref?: string;
}) {
  const visible = employees.slice(0, VISIBLE_EMPLOYEES);

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
              <TableHead>No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
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

            {visible.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="text-muted-foreground">
                  {employee.employeeNo}
                </TableCell>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.department ?? "—"}</TableCell>
                <TableCell>{employee.position ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={employee.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
