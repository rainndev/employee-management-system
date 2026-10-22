"use client";

import Link from "next/link";
import {
  BriefcaseIcon,
  Building2Icon,
  CalendarDaysIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
  const items = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
  ];

  if (canManage(user.role) || canApprove(user.role)) {
    items.push({
      title: "Employees",
      url: "/employees",
      icon: <UsersIcon />,
    });
  }

  items.push(
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
    {
      title: "Leave",
      url: "/leave",
      icon: <CalendarDaysIcon />,
    }
  );

  if (user.role === "admin") {
    items.push({
      title: "Admin",
      url: "/admin",
      icon: <ShieldCheckIcon />,
    });
  }

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
                <span className="text-base font-semibold">EMS</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
