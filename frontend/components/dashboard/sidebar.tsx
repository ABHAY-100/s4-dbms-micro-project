"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Heart, Home, Users, Box, Clipboard, Calendar, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Chambers", href: "/dashboard/chambers", icon: Box },
    { name: "Deceased Records", href: "/dashboard/deceased", icon: Clipboard },
    { name: "Services", href: "/dashboard/services", icon: Calendar },
    ...(isAdmin ? [{ name: "Staff Management", href: "/dashboard/staff", icon: Users }] : []),
    { name: "Profile", href: "/dashboard/profile", icon: User },
  ]

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Heart className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">MMS</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t p-4">
        <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/")}>
          Back to Home
        </Button>
      </div>
    </div>
  )
}

