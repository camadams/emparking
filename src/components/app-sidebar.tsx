"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { saasConfig } from "@/saas-config";
import { Home, Search, Scale, Moon, Sun, ChartBar } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { UserButton } from "@daveyplate/better-auth-ui";
import DarkModeButton from "./dark-mode-button";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Dummy",
    url: "/dashboard/dummy",
    icon: ChartBar,
  },
];

export function AppSidebar() {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      {/* <SidebarHeader>
        <Link href={"/"} className="flex flex-row space-x-2">
          <span className="font-[family-name:var(--font-geist-sans)]">
            {saasConfig.appName}
          </span>
        </Link>
      </SidebarHeader> */}
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Mirror Mirror</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span className="font-[family-name:var(--font-geist-sans)]">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <DarkModeButton />
        <Button variant="outline" size="icon" asChild>
          <SidebarTrigger />
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
