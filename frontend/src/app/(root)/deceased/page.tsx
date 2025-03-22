"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, MoreHorizontal, Search, Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function DeceasedPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: deceasedRecords, isLoading } = useQuery({
    queryKey: ["deceased"],
    queryFn: async () => {
      const response = await axiosInstance.get("/deceased/all");
      return response.data;
    },
  });

  const filteredRecords = deceasedRecords
    ? deceasedRecords.filter((record) => {
        const matchesSearch =
          searchTerm === "" ||
          `${record.firstName} ${record.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesStatus =
          statusFilter === "ALL" || record.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
    : [];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Deceased Records</h1>
          <Button asChild>
            <Link href="/deceased/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Records</CardTitle>
            <CardDescription>
              Manage and view all deceased records in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name..."
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
                  <SelectItem value="IN_FACILITY">In Facility</SelectItem>
                  <SelectItem value="RELEASED">Released</SelectItem>
                  <SelectItem value="PROCESSED">Processed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading records...</p>
              </div>
            ) : filteredRecords.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Date of Death</TableHead>
                      <TableHead>Chamber</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.firstName} {record.lastName}
                        </TableCell>
                        <TableCell>
                          {format(new Date(record.dateOfDeath), "PPP")}
                        </TableCell>
                        <TableCell>
                          {record.chamber
                            ? `${record.chamber.name} (${record.chamberUnitName})`
                            : "Not assigned"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              record.status === "IN_FACILITY"
                                ? "bg-blue-100 text-blue-800"
                                : record.status === "RELEASED"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {record.status}
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
                                <Link href={`/deceased/${record.id}`}>
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/deceased/${record.id}/edit`}>
                                  Edit Record
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/deceased/${record.id}/services`}>
                                  Manage Services
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/deceased/${record.id}/next-of-kin`}
                                >
                                  Next of Kin
                                </Link>
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
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No Records Found</p>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {searchTerm || statusFilter !== "ALL"
                    ? "No records match your search criteria."
                    : "You haven't added any deceased records yet."}
                </p>
                {!searchTerm && statusFilter === "ALL" && (
                  <Button asChild>
                    <Link href="/deceased/new">Add Record</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
