"use client"

import { useAuth } from "@/lib/auth-provider"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchWithAuth } from "@/lib/api"
import { Loader2, User, Search } from "lucide-react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { API_BASE_URL } from "@/lib/api"

export function StaffManagement() {
  const { token, user } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")

  const isAdmin = useMemo(() => user?.role === "admin", [user?.role])

  const { data: staffList, isLoading } = useQuery({
    queryKey: ["staffList"],
    queryFn: () => fetchWithAuth("/users/staff", token!),
    enabled: !!token && isAdmin,
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await fetch(`${API_BASE_URL}/users/staff/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, isActive }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update status")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffList"] })
      toast({
        title: "Status Updated",
        description: "Staff member status has been successfully updated.",
      })
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      })
    },
  })

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <User className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-lg font-medium">Admin Access Required</h3>
        <p className="text-muted-foreground">You need admin privileges to view staff management.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const filteredStaff =
    staffList?.filter(
      (staff: any) =>
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Staff Management</CardTitle>
          <CardDescription>Manage staff accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="rounded-md border">
            <div className="grid grid-cols-5 p-4 text-sm font-medium border-b">
              <div>Name</div>
              <div>Email</div>
              <div>Role</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y">
              {filteredStaff.map((staff: any) => (
                <div key={staff.id} className="grid grid-cols-5 p-4 text-sm items-center">
                  <div className="font-medium">{staff.name}</div>
                  <div>{staff.email}</div>
                  <div>
                    <Badge variant={staff.role === "admin" ? "secondary" : "outline"}>
                      {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <Switch
                      checked={staff.isActive}
                      onCheckedChange={(checked) => {
                        updateStatusMutation.mutate({ userId: staff.id, isActive: checked })
                      }}
                      disabled={updateStatusMutation.isPending || staff.id === user?.id}
                    />
                  </div>
                  <div className="text-right">
                    <Button variant="ghost" size="sm" disabled={staff.id === user?.id}>
                      Details
                    </Button>
                  </div>
                </div>
              ))}

              {filteredStaff.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">No staff members found</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

