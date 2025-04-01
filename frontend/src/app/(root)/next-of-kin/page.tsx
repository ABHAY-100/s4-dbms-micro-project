"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
//   FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  User,
  Phone,
  Mail,
//   MapPin,
} from "lucide-react";
// import { DashboardLayout } from "@/components/dashboard/layout";

// Interface for next of kin
interface NextOfKin {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  phoneNumber: string;
  email: string;
  address: string;
  deceasedId: string;
}

// Interface for deceased
interface Deceased {
  id: string;
  firstName: string;
  lastName: string;
  dateOfDeath: string;
  status: string;
}

// Form schema for creating/updating a next of kin
const nextOfKinFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  relationship: z.string().min(2, {
    message: "Relationship must be at least 2 characters.",
  }),
  phoneNumber: z.string().min(5, {
    message: "Phone number must be at least 5 characters.",
  }),
  email: z
    .string()
    .email({
      message: "Please enter a valid email address.",
    })
    .optional()
    .or(z.literal("")),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  deceasedId: z.string().min(1, {
    message: "Please select a deceased record.",
  }),
});

type NextOfKinFormValues = z.infer<typeof nextOfKinFormSchema>;

export default function NextOfKinPage() {
  const queryClient = useQueryClient();
  const [selectedDeceasedId, setSelectedDeceasedId] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedKin, setSelectedKin] = useState<NextOfKin | null>(null);

  // Fetch all deceased records
  const { data: deceasedRecords, isLoading: isLoadingDeceased } = useQuery({
    queryKey: ["deceased"],
    queryFn: async () => {
      const response = await axiosInstance.get("/mortuary/deceased/all");
      return response.data;
    },
  });

  // Fetch next of kin for selected deceased
  const { data: nextOfKin, isLoading: isLoadingNextOfKin } = useQuery({
    queryKey: ["nextOfKin", selectedDeceasedId],
    queryFn: async () => {
      if (!selectedDeceasedId) return [];
      const response = await axiosInstance.get(
        `/mortuary/next-of-kin?deceased_id=${selectedDeceasedId}`
      );
      return response.data;
    },
    enabled: !!selectedDeceasedId,
  });

  // Create next of kin form
  const createForm = useForm<NextOfKinFormValues>({
    resolver: zodResolver(nextOfKinFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      relationship: "",
      phoneNumber: "",
      email: "",
      address: "",
      deceasedId: selectedDeceasedId,
    },
  });

  // Edit next of kin form
  const editForm = useForm<NextOfKinFormValues>({
    resolver: zodResolver(nextOfKinFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      relationship: "",
      phoneNumber: "",
      email: "",
      address: "",
      deceasedId: "",
    },
  });

  // Create next of kin mutation
  const createNextOfKinMutation = useMutation({
    mutationFn: async (values: NextOfKinFormValues) => {
      const response = await axiosInstance.post(
        `/mortuary/next-of-kin?deceased_id=${values.deceasedId}`,
        {
          firstName: values.firstName,
          lastName: values.lastName,
          relationship: values.relationship,
          phoneNumber: values.phoneNumber,
          email: values.email || undefined,
          address: values.address,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Next of kin added", {
        description: "The next of kin has been added successfully.",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({
        queryKey: ["nextOfKin", selectedDeceasedId],
      });
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to add next of kin",
      });
    },
  });

  // Update next of kin mutation
  const updateNextOfKinMutation = useMutation({
    mutationFn: async (values: NextOfKinFormValues & { id: string }) => {
      const response = await axiosInstance.put(
        `/mortuary/next-of-kin?kin_id=${values.id}`,
        {
          firstName: values.firstName,
          lastName: values.lastName,
          relationship: values.relationship,
          phoneNumber: values.phoneNumber,
          email: values.email || undefined,
          address: values.address,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Next of kin updated", {
        description: "The next of kin has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      editForm.reset();
      queryClient.invalidateQueries({
        queryKey: ["nextOfKin", selectedDeceasedId],
      });
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to update next of kin",
      });
    },
  });

  // Delete next of kin mutation
  const deleteNextOfKinMutation = useMutation({
    mutationFn: async (kinId: string) => {
      const response = await axiosInstance.delete(
        `/mortuary/next-of-kin?kin_id=${kinId}`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Next of kin deleted", {
        description: "The next of kin has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["nextOfKin", selectedDeceasedId],
      });
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to delete next of kin",
      });
      setIsDeleteDialogOpen(false);
    },
  });

  // Handle create next of kin form submission
  const onCreateSubmit = (data: NextOfKinFormValues) => {
    createNextOfKinMutation.mutate(data);
  };

  // Handle edit next of kin form submission
  const onEditSubmit = (data: NextOfKinFormValues) => {
    if (selectedKin) {
      updateNextOfKinMutation.mutate({
        ...data,
        id: selectedKin.id,
      });
    }
  };

  // Handle delete next of kin
  const handleDeleteNextOfKin = () => {
    if (selectedKin) {
      deleteNextOfKinMutation.mutate(selectedKin.id);
    }
  };

  // Handle edit button click
  const handleEditNextOfKin = (kin: NextOfKin) => {
    setSelectedKin(kin);
    editForm.reset({
      firstName: kin.firstName,
      lastName: kin.lastName,
      relationship: kin.relationship,
      phoneNumber: kin.phoneNumber,
      email: kin.email || "",
      address: kin.address,
      deceasedId: kin.deceasedId,
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (kin: NextOfKin) => {
    setSelectedKin(kin);
    setIsDeleteDialogOpen(true);
  };

  // Get deceased name by ID
  const getDeceasedName = (id: string) => {
    const deceased = deceasedRecords?.find((d) => d.id === id);
    return deceased ? `${deceased.firstName} ${deceased.lastName}` : "Unknown";
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-medium pl-2">Next of Kin Management</h1>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Next of Kin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add Next of Kin</DialogTitle>
                <DialogDescription>
                  Add a next of kin for a deceased record.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(onCreateSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="deceasedId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deceased Record</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a deceased record" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingDeceased ? (
                              <SelectItem value="loading" disabled>
                                Loading records...
                              </SelectItem>
                            ) : deceasedRecords?.length > 0 ? (
                              deceasedRecords.map((deceased) => (
                                <SelectItem
                                  key={deceased.id}
                                  value={deceased.id}
                                >
                                  {deceased.firstName} {deceased.lastName}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-records" disabled>
                                No deceased records found
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={createForm.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Brother, Sister, etc."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="john.doe@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Main Street, City, State, ZIP"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={createNextOfKinMutation.isPending}
                    >
                      {createNextOfKinMutation.isPending
                        ? "Adding..."
                        : "Add Next of Kin"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Next of Kin</CardTitle>
            <CardDescription>
              View and manage next of kin for deceased records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Select Deceased Record
              </label>
              <Select
                value={selectedDeceasedId}
                onValueChange={setSelectedDeceasedId}
              >
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Select a deceased record" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingDeceased ? (
                    <SelectItem value="loading" disabled>
                      Loading records...
                    </SelectItem>
                  ) : deceasedRecords?.length > 0 ? (
                    deceasedRecords.map((deceased) => (
                      <SelectItem key={deceased.id} value={deceased.id}>
                        {deceased.firstName} {deceased.lastName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-records" disabled>
                      No deceased records found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedDeceasedId ? (
              isLoadingNextOfKin ? (
                <div className="flex justify-center py-8">
                  <p>Loading next of kin records...</p>
                </div>
              ) : nextOfKin?.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Relationship</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nextOfKin.map((kin) => (
                        <TableRow key={kin.id}>
                          <TableCell>
                            <div className="font-medium">
                              {kin.firstName} {kin.lastName}
                            </div>
                          </TableCell>
                          <TableCell>{kin.relationship}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{kin.phoneNumber}</span>
                              </div>
                              {kin.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span>{kin.email}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditNextOfKin(kin)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDeleteClick(kin)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    No Next of Kin Found
                  </p>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    This deceased record doesn't have any next of kin records
                    yet.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    Add Next of Kin
                  </Button>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  Select a Deceased Record
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  Please select a deceased record to view and manage its next of
                  kin.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Next of Kin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Next of Kin</DialogTitle>
            <DialogDescription>
              Update the details of this next of kin.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={updateNextOfKinMutation.isPending}
                >
                  {updateNextOfKinMutation.isPending
                    ? "Updating..."
                    : "Update Next of Kin"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              next of kin record for {selectedKin?.firstName}{" "}
              {selectedKin?.lastName} from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNextOfKin}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteNextOfKinMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
