"use client";

import Link from "next/link";
import {
  BriefcaseIcon,
  Building2Icon,
  CalendarDaysIcon,
  CirclePlusIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { NavMain, type NavItem } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
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
  const quickCreateLabel = manage ? "Add employee" : "New leave request";

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
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                >
                  <Link href={quickCreateHref}>
                    <CirclePlusIcon />
                    <span>{quickCreateLabel}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
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
