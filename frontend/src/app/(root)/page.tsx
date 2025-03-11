"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      // Don't call axios directly here - let the store handle it
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <p>Welcome, {user?.name || "User"}</p>
      <Button variant="outline" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  );
}
