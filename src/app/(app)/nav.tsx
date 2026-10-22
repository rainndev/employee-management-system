import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { canApprove, canManage } from "@/lib/roles";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export async function Nav() {
  const user = await requireUser();

  const links: { href: string; label: string }[] = [
    { href: "/dashboard", label: "Dashboard" },
  ];

  if (canManage(user.role) || canApprove(user.role)) {
    links.push({ href: "/employees", label: "Employees" });
  }

  links.push(
    { href: "/departments", label: "Departments" },
    { href: "/positions", label: "Positions" },
    { href: "/leave", label: "Leave" }
  );

  if (user.role === "admin") {
    links.push({ href: "/admin", label: "Admin" });
  }

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-1 gap-y-2 px-6 py-2.5 text-sm">
        <Link href="/dashboard" className="mr-2 font-semibold">
          EMS
        </Link>

        {links.map((link) => (
          <Button key={link.href} asChild variant="ghost" size="sm">
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}

        <span className="ml-auto text-xs text-muted-foreground">
          {user.email}
          <span className="mx-1.5">·</span>
          <span className="capitalize">{user.role}</span>
        </span>

        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </nav>
    </header>
  );
}
