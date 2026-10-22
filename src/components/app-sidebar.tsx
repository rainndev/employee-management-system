"use client";

import { NavMain, type NavItem } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { canApprove, canManage, type Role } from "@/lib/roles";
import {
  BriefcaseIcon,
  Building2Icon,
  CalendarDaysIcon,
  LayoutDashboardIcon,
  PlusIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

export function AppSidebar({
  user,
  ...props
}: { user: { email: string; role: Role } } & React.ComponentProps<
  typeof Sidebar
>) {
  const manage = canManage(user.role);

  const main: NavItem[] = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Leave",
      url: "/leave",
      icon: <CalendarDaysIcon />,
    },
  ];

  const people: NavItem[] =
    manage || canApprove(user.role)
      ? [
          {
            title: "Employees",
            url: "/employees",
            icon: <UsersIcon />,
          },
        ]
      : [];

  const organisation: NavItem[] = [
    {
      title: "Departments",
      url: "/departments",
      icon: <Building2Icon />,
    },
    {
      title: "Positions",
      url: "/positions",
      icon: <BriefcaseIcon />,
    },
  ];

  const admin: NavItem[] =
    user.role === "admin"
      ? [
          {
            title: "Admin",
            url: "/admin",
            icon: <ShieldCheckIcon />,
          },
        ]
      : [];

  const quickCreateHref = manage ? "/employees" : "/leave";

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/dashboard">
                <BriefcaseIcon className="size-5!" />
                <span className="text-base font-semibold">Employee System</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex items-center gap-2">
              <Button
                asChild
                className="h-8 flex-1 justify-start gap-2 rounded-lg px-2"
              >
                <Link href={quickCreateHref}>
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary-foreground text-primary">
                    <PlusIcon className="size-2" strokeWidth={3} />
                  </span>
                  <span className="truncate">Quick Create</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label="Leave requests"
              >
                <Link href="/leave">
                  <CalendarDaysIcon />
                </Link>
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <NavMain items={main} />
        {people.length > 0 && <NavMain label="People" items={people} />}
        <NavMain label="Organisation" items={organisation} />
        {admin.length > 0 && <NavMain label="Admin" items={admin} />}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
