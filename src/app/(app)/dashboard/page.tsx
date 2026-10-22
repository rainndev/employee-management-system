import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { canApprove, canManage } from "@/lib/roles";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
      >
        <Profile />
      </Suspense>
    </main>
  );
}

async function Profile() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const links: { href: string; label: string; hint: string }[] = [
    { href: "/leave", label: "Leave requests", hint: "File or review leave" },
  ];

  if (canManage(user.role) || canApprove(user.role)) {
    links.push({
      href: "/employees",
      label: "Employees",
      hint: "Employee records",
    });
  }

  links.push(
    { href: "/departments", label: "Departments", hint: "Org structure" },
    { href: "/positions", label: "Positions", hint: "Job titles" }
  );

  if (user.role === "admin") {
    links.push({ href: "/admin", label: "Admin", hint: "Users and access" });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {user.email} ·{" "}
            <span className="capitalize">{user.role}</span>
          </p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle>{link.label}</CardTitle>
                <CardDescription>{link.hint}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
