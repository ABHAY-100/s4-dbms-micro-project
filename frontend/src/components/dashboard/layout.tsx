"use client";

import type React from "react";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="fixed w-full top-0 left-0 right-0 bg-zinc-100 z-50">
        <Header />
      </div>
      <div className="flex flex-1 mt-16">
        <aside className="fixed w-64 h-[calc(100vh-4rem)] border-r bg-background hidden md:block">
          <ScrollArea className="h-full">
            <Sidebar />
          </ScrollArea>
        </aside>
        <main className="flex-1 p-6 overflow-auto md:ml-64">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
