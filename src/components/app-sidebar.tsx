"use client";

import { NavMain, type NavItem } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { BrandMark } from "@/components/brand-mark";
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
  BuildingIcon,
  CalendarIcon,
  LayoutDashboardIcon,
  PlusIcon,
  ShieldIcon,
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
      icon: <LayoutDashboardIcon strokeWidth={1.5} />,
    },
    {
      title: "Leave",
      url: "/leave",
      icon: <CalendarIcon strokeWidth={1.5} />,
    },
  ];

  const people: NavItem[] =
    manage || canApprove(user.role)
      ? [
          {
            title: "Employees",
            url: "/employees",
            icon: <UsersIcon strokeWidth={1.5} />,
          },
        ]
      : [];

  const organisation: NavItem[] = [
    {
      title: "Departments",
      url: "/departments",
      icon: <BuildingIcon strokeWidth={1.5} />,
    },
    {
      title: "Positions",
      url: "/positions",
      icon: <BriefcaseIcon strokeWidth={1.5} />,
    },
  ];

  const admin: NavItem[] =
    user.role === "admin"
      ? [
          {
            title: "Admin",
            url: "/admin",
            icon: <ShieldIcon strokeWidth={1.5} />,
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
                <BrandMark className="size-5! text-primary" />
                <span className="text-base font-semibold">CoreHR</span>
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
                  <span className="truncate">Leave Request</span>
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
                  <CalendarIcon strokeWidth={1.5} />
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
