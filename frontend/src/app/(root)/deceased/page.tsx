"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/layout";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  Heart,
  MapPin,
  Package,
  FileText,
  User,
  Trash2,
} from "lucide-react";
import { DeceasedRecord } from "@/types";

export default function Page() {
  const [data, setData] = useState<DeceasedRecord[]>([]);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const [selectedRecord, setSelectedRecord] = useState<DeceasedRecord | null>(
    null
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] =
    useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const queryClient = useQueryClient();

  const handleViewDetails = async (id: string) => {
    try {
      const response = await axiosInstance.get(
        `/mortuary/deceased?deceased_id=${id}`
      );
      setSelectedRecord(response.data);
      setIsViewDialogOpen(true);
    } catch (error: any) {
      toast.error("Error", {
        description:
          error.response?.data?.message || "Failed to load record details",
      });
    }
  };

  const columns: ColumnDef<DeceasedRecord>[] = [
    {
      accessorKey: "firstName",
      header: "First Name",
    },
    {
      accessorKey: "lastName",
      header: "Last Name",
    },
    {
      accessorKey: "dateOfDeath",
      header: "Date of Death",
      cell: ({ row }) => format(new Date(row.getValue("dateOfDeath")), "PPP"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = String(row.getValue("status"));
        let bgColor = "bg-gray-100";
        let textColor = "text-gray-800";

        if (status === "IN_FACILITY") {
          bgColor = "bg-blue-100";
          textColor = "text-blue-800";
        } else if (status === "RELEASED") {
          bgColor = "bg-green-100";
          textColor = "text-green-800";
        } else if (status === "PROCESSED") {
          bgColor = "bg-purple-100";
          textColor = "text-purple-800";
        }

        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bgColor} ${textColor}`}
            >
              {status}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const record = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewDetails(record.id)}>
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await axiosInstance.put(`/mortuary/deceased?id=${id}`, {
        status,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Status updated", {
        description:
          "The deceased record status has been updated successfully.",
      });
      setIsUpdateStatusDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["deceased"] });
    },
    onError: (error: any) => {
      toast.error("Error", {
        description: error.response?.data?.message || "Failed to update status",
      });
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axiosInstance.delete(
        `/mortuary/deceased?deceased_id=${id}`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Record deleted", {
        description: "The deceased record has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["deceased"] });
    },
    onError: (error: any) => {
      toast.error("Error", {
        description: error.response?.data?.message || "Failed to delete record",
      });
      setIsDeleteDialogOpen(false);
    },
  });

  const handleUpdateStatus = () => {
    if (selectedRecord && selectedStatus) {
      updateStatusMutation.mutate({
        id: selectedRecord.id,
        status: selectedStatus,
      });
    }
  };

  const handleDeleteRecord = () => {
    if (selectedRecord) {
      deleteRecordMutation.mutate(selectedRecord.id);
    }
  };

  const {
    isError,
    error,
    data: fetchedData,
  } = useQuery({
    queryKey: ["deceased"],
    queryFn: async () => {
      try {
        console.log("Fetching deceased data...");
        const res = await axiosInstance.get("/mortuary/deceased/all");
        console.log("API response:", res.data);
        return res.data;
      } catch (error: any) {
        console.error("API error:", error);
        console.error("Response:", error.response?.data);
        throw new Error(
          error.response?.data?.message || "Failed to load deceased records"
        );
      }
    },
  });

  useEffect(() => {
    if (fetchedData) {
      console.log("Query succeeded with data:", fetchedData);
      if (Array.isArray(fetchedData)) {
        console.log("Setting data array of length:", fetchedData.length);
        setData(fetchedData);
      } else {
        console.error("Response is not an array:", fetchedData);
        toast.error("Data format error", {
          description: "The API returned data in an unexpected format.",
        });
        setData([]);
      }
    }
  }, [fetchedData]);

  useEffect(() => {
    if (isError && error instanceof Error) {
      console.error("Query error:", error);
      toast.error("Error", {
        description: error.message || "Failed to load deceased records",
      });
    }
  }, [isError, error]);

  const filteredData = search
    ? data.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      )
    : data;

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  useEffect(() => {
    if (isError) {
      router.push("/login");
    }
  }, [isError, router]);

  if (isError) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-6 rounded-md">
          <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
          <p>
            {(error as Error)?.message || "Failed to load deceased records"}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.refresh()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const renderPersonalBelongings = () => {
    if (!selectedRecord) return null;
    
    console.log("Personal belongings:", selectedRecord.personalBelongings);
    
    if (typeof selectedRecord.personalBelongings === "string") {
      if (!selectedRecord.personalBelongings) return null;
      
      try {
        // Try to parse if it's a JSON string
        const items = JSON.parse(selectedRecord.personalBelongings);
        console.log("Parsed items:", items);
        
        if (Array.isArray(items)) {
          return (
            <div className="pl-5 space-y-1">
              {items.map((item, index) => (
                <div key={index} className="text-base">
                  {String(item)}
                </div>
              ))}
            </div>
          );
        } else if (typeof items === 'object') {
          // Handle case where it might be an object
          return (
            <div className="pl-5 space-y-1">
              {Object.entries(items).map(([key, value], index) => (
                <div key={index} className="text-base">
                  {`${key}: ${String(value)}`}
                </div>
              ))}
            </div>
          );
        } else {
          return <p className="text-base">{String(items)}</p>;
        }
      } catch (error) {
        console.log("Error parsing personal belongings:", error);
        // If not valid JSON, display as regular string
        return (
          <p className="text-base">
            {String(selectedRecord.personalBelongings)}
          </p>
        );
      }
    } else if (Array.isArray(selectedRecord.personalBelongings)) {
      // Handle case where it might already be an array
      return (
        <div className="space-y-1">
          {selectedRecord.personalBelongings.map((item, index) => (
            <div key={index} className="text-base">
              {String(item)}
            </div>
          ))}
        </div>
      );
    }
    
    return <p className="text-muted-foreground">No personal belongings recorded</p>;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-medium pl-2">Deceased Records</h1>
          <Link href="/deceased/new">
            <Button>Add Record</Button>
          </Link>
        </div>

        <div className="py-4">
          <Input
            type="search"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {data.length === 0 ? (
          <div className="text-center py-8 border rounded-md">
            <p className="text-muted-foreground">No deceased records found.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a new record to get started.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="text-center py-4"
                      >
                        No results found for your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredRowModel().rows.length} of {data.length}{" "}
                row(s) selected
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedRecord && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">
                    {selectedRecord.firstName} {selectedRecord.lastName}
                  </DialogTitle>
                  <DialogDescription>
                    Detailed information about the deceased.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Full Name
                        </p>
                      </div>
                      <p className="text-lg font-medium">
                        {selectedRecord.firstName} {selectedRecord.lastName}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Gender
                        </p>
                      </div>
                      <p className="text-lg font-medium">
                        {selectedRecord.gender}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Date of Birth
                        </p>
                      </div>
                      <p className="text-lg font-medium">
                        {format(new Date(selectedRecord.dateOfBirth), "PPP")}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Date of Death
                        </p>
                      </div>
                      <p className="text-lg font-medium">
                        {format(new Date(selectedRecord.dateOfDeath), "PPP")} at{" "}
                        {selectedRecord.timeOfDeath}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Cause of Death
                        </p>
                      </div>
                      <p className="text-lg font-medium">
                        {selectedRecord.causeOfDeath}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Status
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            selectedRecord.status === "IN_FACILITY"
                              ? "bg-blue-100 text-blue-800"
                              : selectedRecord.status === "RELEASED"
                              ? "bg-green-100 text-green-800"
                              : selectedRecord.status === "PROCESSED"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {String(selectedRecord.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Chamber Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium text-muted-foreground">
                            Chamber Unit
                          </p>
                        </div>
                        <p className="text-lg font-medium">
                          {selectedRecord.chamberUnitName || "Not assigned"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {(selectedRecord.identificationMarks ||
                    selectedRecord.personalBelongings) && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Additional Information
                        </h3>

                        {selectedRecord.identificationMarks && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm font-medium text-muted-foreground">
                                Identification Marks
                              </p>
                            </div>
                            <p className="text-base">
                              {selectedRecord.identificationMarks}
                            </p>
                          </div>
                        )}

                        {selectedRecord.personalBelongings && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm font-medium text-muted-foreground">
                                Personal Belongings
                              </p>
                            </div>
                            {renderPersonalBelongings()}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {selectedRecord.nextOfKin &&
                    selectedRecord.nextOfKin.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Next of Kin</h3>
                          <div className="grid grid-cols-1 gap-4">
                            {selectedRecord.nextOfKin.map((kin, index) => (
                              <div
                                key={index}
                                className="border rounded-md p-4"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                      Name
                                    </p>
                                    <p className="font-medium">
                                      {kin.firstName} {kin.lastName}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                      Relationship
                                    </p>
                                    <p className="font-medium">
                                      {kin.relationship}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                      Phone
                                    </p>
                                    <p className="font-medium">
                                      {kin.phoneNumber}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                      Email
                                    </p>
                                    <p className="font-medium">
                                      {kin.email || "N/A"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                </div>

                <DialogFooter className="flex justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsUpdateStatusDialogOpen(true);
                        setIsViewDialogOpen(false);
                      }}
                    >
                      Update Status
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setIsDeleteDialogOpen(true);
                        setIsViewDialogOpen(false);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsViewDialogOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={isUpdateStatusDialogOpen}
          onOpenChange={setIsUpdateStatusDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Record Status</DialogTitle>
              <DialogDescription>
                Change the current status of this deceased record.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_FACILITY">In Facility</SelectItem>
                  <SelectItem value="RELEASED">Released</SelectItem>
                  <SelectItem value="PROCESSED">Processed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUpdateStatusDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={!selectedStatus || updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending
                  ? "Updating..."
                  : "Update Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                deceased record{" "}
                {selectedRecord
                  ? `for ${selectedRecord.firstName} ${selectedRecord.lastName}`
                  : ""}{" "}
                from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteRecord}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteRecordMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
