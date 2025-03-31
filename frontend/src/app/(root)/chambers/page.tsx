"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Bed, Edit, Trash } from "lucide-react";

const chamberFormSchema = z.object({
  name: z.string().regex(/^[A-Z]$/, {
    message: "Chamber name must be a single uppercase letter (A-Z)",
  }),
  capacity: z.coerce
    .number()
    .int()
    .positive({ message: "Capacity must be a positive integer" }),
});

type ChamberFormValues = z.infer<typeof chamberFormSchema>;

const chamberUpdateSchema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "OUT_OF_ORDER"]),
  capacity: z.coerce
    .number()
    .int()
    .positive({ message: "Capacity must be a positive integer" })
    .optional(),
});

type ChamberUpdateValues = z.infer<typeof chamberUpdateSchema>;

export default function ChambersPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedChamber, setSelectedChamber] = useState(null);

  const {
    data: chambers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["chambers"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("mortuary/chambers/all");
        return response.data;
      } catch (error) {
        console.error("Error fetching chambers:", error);
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "An unknown error occurred",
          {
            description: "Failed to fetch chambers",
          }
        );
        throw error;
      }
    },
  });

  const createForm = useForm<ChamberFormValues>({
    resolver: zodResolver(chamberFormSchema),
    defaultValues: {
      name: "",
      capacity: 10,
    },
  });

  const editForm = useForm<ChamberUpdateValues>({
    resolver: zodResolver(chamberUpdateSchema),
    defaultValues: {
      status: "AVAILABLE",
      capacity: 10,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: ChamberFormValues) => {
      const response = await axiosInstance.post("/mortuary/chambers", values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chambers"] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success("Chamber created successfully", {
        description: "The chamber has been created successfully.",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create chamber");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: ChamberUpdateValues) => {
      const response = await axiosInstance.put(
        `/mortuary/chambers?chamber_name=${selectedChamber.name}`,
        values
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chambers"] });
      setIsEditOpen(false);
      editForm.reset();
      toast.success("Chamber updated successfully", {
        description: "The chamber has been updated successfully.",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update chamber");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.delete(
        `mortuary/chambers?chamber_name=${selectedChamber.name}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chambers"] });
      setIsDeleteOpen(false);
      toast.success("Chamber deleted successfully", {
        description: "The chamber has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete chamber");
    },
  });

  function onCreateSubmit(data: ChamberFormValues) {
    createMutation.mutate(data);
  }

  function onEditSubmit(data: ChamberUpdateValues) {
    updateMutation.mutate(data);
  }

  function handleEditChamber(chamber) {
    setSelectedChamber(chamber);
    editForm.reset({
      status: chamber.status,
      capacity: chamber.capacity,
    });
    setIsEditOpen(true);
  }

  function handleDeleteChamber(chamber) {
    setSelectedChamber(chamber);
    setIsDeleteOpen(true);
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-medium pl-2">Chambers</h1>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>Add Chamber</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Chamber</DialogTitle>
                <DialogDescription>
                  Add a new chamber to the mortuary. Chamber names must be a
                  single uppercase letter.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(onCreateSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chamber Name</FormLabel>
                        <FormControl>
                          <Input placeholder="A" {...field} />
                        </FormControl>
                        <FormDescription>
                          A single uppercase letter (A-Z)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="10"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of units in this chamber
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending
                        ? "Creating..."
                        : "Create Chamber"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <p>Loading chambers...</p>
          </div>
        ) : chambers?.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chambers.map((chamber) => (
              <Card key={chamber.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">
                      Chamber {chamber.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditChamber(chamber)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteChamber(chamber)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Status:{" "}
                    <span
                      className={
                        chamber.status === "AVAILABLE"
                          ? "text-green-600"
                          : chamber.status === "OCCUPIED"
                          ? "text-red-600"
                          : "text-amber-600"
                      }
                    >
                      {chamber.status}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">
                      Capacity
                    </span>
                    <span className="font-medium">
                      {chamber.capacity} units
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">
                      Units Available
                    </span>
                    <span className="font-medium">
                      {chamber.capacity - chamber.currentOccupancy} units
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Occupancy
                    </span>
                    <span className="font-medium">
                      {chamber.currentOccupancy}/{chamber.capacity}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Bed className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No Chambers Found</p>
              <p className="text-sm text-muted-foreground text-center mb-4">
                You haven't added any chambers yet. Create your first chamber to
                get started.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>Add Chamber</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chamber {selectedChamber?.name}</DialogTitle>
            <DialogDescription>
              Update the chamber's status or capacity.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Available</SelectItem>
                        <SelectItem value="OCCUPIED">Occupied</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="OUT_OF_ORDER">
                          Out of Order
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Current operational status of the chamber
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="10"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of units in this chamber
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Chamber"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chamber {selectedChamber?.name}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chamber? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Chamber"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
