"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axios";

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
      await axiosInstance.post("/users/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      logout();
      router.push("/login");
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
