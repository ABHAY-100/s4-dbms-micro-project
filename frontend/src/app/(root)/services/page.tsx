"use client"

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, MoreHorizontal, Search } from "lucide-react"
import Link from "next/link"

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [typeFilter, setTypeFilter] = useState("ALL")

  // This would be a real API call to get all services
  // For now, we'll use a mock query
  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      // This would be replaced with a real API call
      return [
        {
          id: "1",
          name: "Embalming",
          description: "Standard embalming service",
          type: "CARE",
          cost: 500,
          status: "COMPLETED",
          completedAt: "2023-05-15T10:30:00Z",
          deceased: {
            id: "101",
            firstName: "John",
            lastName: "Doe",
            status: "IN_FACILITY",
          },
        },
        {
          id: "2",
          name: "Funeral Service",
          description: "Basic funeral service package",
          type: "RITUAL",
          cost: 1200,
          status: "PENDING",
          completedAt: null,
          deceased: {
            id: "102",
            firstName: "Jane",
            lastName: "Smith",
            status: "IN_FACILITY",
          },
        },
        {
          id: "3",
          name: "Transportation",
          description: "Transport to cemetery",
          type: "LOGISTICS",
          cost: 300,
          status: "IN_PROGRESS",
          completedAt: null,
          deceased: {
            id: "103",
            firstName: "Robert",
            lastName: "Johnson",
            status: "IN_FACILITY",
          },
        },
      ]
    },
  })

  const filteredServices = services
    ? services.filter((service) => {
        const matchesSearch =
          searchTerm === "" ||
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${service.deceased.firstName} ${service.deceased.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === "ALL" || service.status === statusFilter

        const matchesType = typeFilter === "ALL" || service.type === typeFilter

        return matchesSearch && matchesStatus && matchesType
      })
    : []

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Services</h1>
          <Button asChild>
            <Link href="/services/new">Add Service</Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Services</CardTitle>
            <CardDescription>Manage and view all services provided to the deceased.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search services or deceased..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="CARE">Care</SelectItem>
                  <SelectItem value="RITUAL">Ritual</SelectItem>
                  <SelectItem value="LOGISTICS">Logistics</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading services...</p>
              </div>
            ) : filteredServices.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Deceased</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                          {service.deceased.firstName} {service.deceased.lastName}
                        </TableCell>
                        <TableCell>{service.type}</TableCell>
                        <TableCell>${service.cost.toFixed(2)}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              service.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : service.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-800"
                                  : service.status === "COMPLETED"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            {service.status}
                          </span>
                        </TableCell>
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
                                <Link href={`/services/${service.id}`}>View Details</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/services/${service.id}/edit`}>Edit Service</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/deceased/${service.deceased.id}`}>View Deceased</Link>
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
                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No Services Found</p>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL"
                    ? "No services match your search criteria."
                    : "You haven't added any services yet."}
                </p>
                {!searchTerm && statusFilter === "ALL" && typeFilter === "ALL" && (
                  <Button asChild>
                    <Link href="/services/new">Add Service</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

