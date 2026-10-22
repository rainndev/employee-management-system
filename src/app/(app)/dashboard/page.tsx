import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { canApprove, canManage } from "@/lib/roles";
import { getDashboardStats } from "@/lib/analytics";
import { getSignupSeries } from "@/lib/admin";
import { SignupsChart } from "@/components/signups-chart";
import { SectionCards } from "@/components/section-cards";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-10 text-sm text-muted-foreground">
          Loading...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const stats = await getDashboardStats(user);
  const signups = user.role === "admin" ? await getSignupSeries(90) : null;

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
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards stats={stats} />

        {signups && (
          <div className="px-4 lg:px-6">
            <SignupsChart data={signups} />
          </div>
        )}

        <div className="flex flex-col gap-3 px-4 lg:px-6">
          <h2 className="text-sm font-medium text-muted-foreground">
            Quick links
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <div className="h-full rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted/40">
                  <p className="font-medium">{link.label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {link.hint}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
