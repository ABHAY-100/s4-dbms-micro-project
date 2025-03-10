"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { StaffManagement } from "@/components/dashboard/staff-management"
import { Loader2, ShieldAlert } from "lucide-react"

export default function StaffPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const isAdmin = user?.role === "admin"

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    } else if (!isAdmin) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, isAdmin, router])

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen bg-muted/30">
        <DashboardSidebar />
        <div className="flex-1">
          <DashboardHeader />
          <main className="p-6 flex flex-col items-center justify-center h-[calc(100vh-64px)]">
            <ShieldAlert className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <DashboardSidebar />
      <div className="flex-1">
        <DashboardHeader />
        <main className="p-6">
          <StaffManagement />
        </main>
      </div>
    </div>
  )
}

