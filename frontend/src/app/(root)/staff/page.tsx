"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/authStore"
import { MoreHorizontal, Users } from "lucide-react"
import Link from "next/link"

export default function StaffPage() {
  const { user } = useAuthStore()
  const router = useRouter()

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.push("/")
    }
  }, [user, router])

  // This would be a real API call to get all staff members
  // For now, we'll use a mock query
  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      // This would be replaced with a real API call
      return [
        {
          id: "1",
          name: "Admin User",
          email: "admin@example.com",
          role: "ADMIN",
          createdAt: "2023-01-15T10:30:00Z",
          status: "ACTIVE",
        },
        {
          id: "2",
          name: "Staff Member 1",
          email: "staff1@example.com",
          role: "STAFF",
          createdAt: "2023-02-20T14:45:00Z",
          status: "ACTIVE",
        },
        {
          id: "3",
          name: "Staff Member 2",
          email: "staff2@example.com",
          role: "STAFF",
          createdAt: "2023-03-10T09:15:00Z",
          status: "INACTIVE",
        },
      ]
    },
  })

  if (user?.role !== "ADMIN") {
    return null
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <Button asChild>
            <Link href="/staff/new">Add Staff Member</Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>Manage staff members and their access to the system.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading staff members...</p>
              </div>
            ) : staff?.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              member.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {member.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/staff/${member.id}`}>View Details</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/staff/${member.id}/edit`}>Edit Staff</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className={member.status === "ACTIVE" ? "text-red-600" : "text-green-600"}
                              >
                                {member.status === "ACTIVE" ? "Deactivate Account" : "Activate Account"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No Staff Members Found</p>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  You haven't added any staff members yet.
                </p>
                <Button asChild>
                  <Link href="/staff/new">Add Staff Member</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

