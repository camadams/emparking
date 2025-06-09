"use client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserButton } from "@daveyplate/better-auth-ui";
import { Button } from "@/components/ui/button";
import { useAuthenticate } from "@daveyplate/better-auth-ui";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useAuthenticate();
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col w-full  p-2">
        <div className="flex justify-between sm:justify-end">
          <Button className="sm:hidden" variant="outline" size="icon" asChild>
            <SidebarTrigger />
          </Button>
          <UserButton />
        </div>

        {children}
      </div>
    </SidebarProvider>
  );
}
