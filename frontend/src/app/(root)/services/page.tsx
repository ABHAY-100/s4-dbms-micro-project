"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Plus, Edit, Trash2, Package, FileText } from "lucide-react"

// Service type enum
enum ServiceType {
  CARE = "CARE",
  RITUAL = "RITUAL",
  LOGISTICS = "LOGISTICS",
  OTHER = "OTHER",
}

// Service status enum
enum ServiceStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

// Interface for service
interface Service {
  id: string
  name: string
  description: string
  type: ServiceType
  status: ServiceStatus
  cost: number
  createdAt: string
  updatedAt: string
  deceasedId: string
}

// Interface for deceased
interface Deceased {
  id: string
  firstName: string
  lastName: string
  dateOfDeath: string
  status: string
}

// Form schema for creating/updating a service
const serviceFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  type: z.enum(["CARE", "RITUAL", "LOGISTICS", "OTHER"], {
    message: "Please select a valid service type.",
  }),
  status: z
    .enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"], {
      message: "Please select a valid status.",
    })
    .optional(),
  cost: z.coerce.number().min(0, {
    message: "Cost must be a positive number.",
  }),
  deceasedId: z.string().min(1, {
    message: "Please select a deceased record.",
  }),
})

type ServiceFormValues = z.infer<typeof serviceFormSchema>

export default function ServicesPage() {
  const queryClient = useQueryClient()
  const [selectedDeceasedId, setSelectedDeceasedId] = useState<string>("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  // Fetch all deceased records
  const { data: deceasedRecords, isLoading: isLoadingDeceased } = useQuery({
    queryKey: ["deceased"],
    queryFn: async () => {
      const response = await axiosInstance.get("/mortuary/deceased/all")
      return response.data
    },
  })

  // Fetch services for selected deceased
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ["services", selectedDeceasedId],
    queryFn: async () => {
      if (!selectedDeceasedId) return []
      const response = await axiosInstance.get(`/mortuary/services?deceased_id=${selectedDeceasedId}`)
      return response.data
    },
    enabled: !!selectedDeceasedId,
  })

  // Create service form
  const createForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: undefined,
      cost: 0,
      deceasedId: selectedDeceasedId,
    },
  })

  // Edit service form with improved initialization
  const editForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: undefined,
      status: undefined,
      cost: 0,
      deceasedId: "",
    },
    mode: "onChange", // Enable validation as fields change
  })

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (values: ServiceFormValues) => {
      const response = await axiosInstance.post(`/mortuary/services?deceased_id=${values.deceasedId}`, {
        name: values.name,
        description: values.description,
        type: values.type,
        cost: values.cost,
      })
      return response.data
    },
    onSuccess: () => {
      toast.success("Service created", {
        description: "The service has been created successfully.",
      })
      setIsCreateDialogOpen(false)
      createForm.reset()
      queryClient.invalidateQueries({ queryKey: ["services", selectedDeceasedId] })
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to create service",
      })
    },
  })

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async (values: ServiceFormValues & { id: string }) => {
      console.log("Updating service with data:", values);
      const response = await axiosInstance.put(`/mortuary/services?service_id=${values.id}`, {
        name: values.name,
        description: values.description,
        type: values.type,
        status: values.status,
        cost: values.cost,
      })
      return response.data
    },
    onSuccess: () => {
      toast.success("Service updated", {
        description: "The service has been updated successfully.",
      })
      setIsEditDialogOpen(false)
      editForm.reset()
      queryClient.invalidateQueries({ queryKey: ["services", selectedDeceasedId] })
    },
    onError: (error: any) => {
      console.error("Service update failed:", error);
      toast.error("Error", {
        description: error.response?.data?.message || error.message || "Failed to update service",
      })
    },
  })

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const response = await axiosInstance.delete(`/mortuary/services?service_id=${serviceId}`)
      return response.data
    },
    onSuccess: () => {
      toast.success("Service deleted", {
        description: "The service has been deleted successfully.",
      })
      setIsDeleteDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ["services", selectedDeceasedId] })
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to delete service",
      })
      setIsDeleteDialogOpen(false)
    },
  })

  // Handle create service form submission
  const onCreateSubmit = (data: ServiceFormValues) => {
    createServiceMutation.mutate(data)
  }

  // Handle edit service form submission
  const onEditSubmit = (data: ServiceFormValues) => {
    console.log("Edit form submitted with data:", data);
    
    // Check if there's a selected service
    if (!selectedService) {
      toast.error("Error", { 
        description: "No service selected for update" 
      });
      return;
    }
    
    try {
      // Log validation state
      const validationErrors = editForm.formState.errors;
      if (Object.keys(validationErrors).length > 0) {
        console.error("Form validation errors:", validationErrors);
        return; // Don't proceed if there are validation errors
      }
      
      const updateData = {
        ...data,
        id: selectedService.id,
      };
      
      console.log("Submitting update for service:", updateData);
      
      // Direct API call instead of using mutation to debug
      axiosInstance.put(`/mortuary/services?service_id=${updateData.id}`, {
        name: updateData.name,
        description: updateData.description,
        type: updateData.type,
        status: updateData.status,
        cost: updateData.cost,
      })
      .then(response => {
        console.log("Update successful:", response.data);
        toast.success("Service updated", {
          description: "The service has been updated successfully.",
        });
        setIsEditDialogOpen(false);
        editForm.reset();
        queryClient.invalidateQueries({ queryKey: ["services", selectedDeceasedId] });
      })
      .catch(error => {
        console.error("API call failed:", error);
        toast.error("Error", {
          description: error.response?.data?.message || error.message || "Failed to update service",
        });
      });
    } catch (error) {
      console.error("Error preparing service update:", error);
      toast.error("Error", { 
        description: "Failed to prepare service update" 
      });
    }
  }

  // Handle delete service
  const handleDeleteService = () => {
    if (selectedService) {
      deleteServiceMutation.mutate(selectedService.id)
    }
  }

  // Handle edit button click with improved form reset
  const handleEditService = (service: Service) => {
    if (!service) return;
    
    setSelectedService(service);
    console.log("Setting up edit form for service:", service);
    
    // Ensure all form fields are properly reset with service data
    editForm.reset({
      name: service.name,
      description: service.description,
      type: service.type,
      status: service.status,
      cost: service.cost,
      deceasedId: service.deceasedId,
    });
    
    // Force validation after reset
    setTimeout(() => {
      editForm.trigger();
    }, 100);
    
    setIsEditDialogOpen(true);
  }

  // Handle delete button click
  const handleDeleteClick = (service: Service) => {
    setSelectedService(service)
    setIsDeleteDialogOpen(true)
  }

  // Get deceased name by ID
  const getDeceasedName = (id: string) => {
    const deceased = deceasedRecords?.find((d) => d.id === id)
    return deceased ? `${deceased.firstName} ${deceased.lastName}` : "Unknown"
  }

  // Get status badge class
  const getStatusBadgeClass = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.PENDING:
        return "bg-yellow-100 text-yellow-800"
      case ServiceStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800"
      case ServiceStatus.COMPLETED:
        return "bg-green-100 text-green-800"
      case ServiceStatus.CANCELLED:
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get type badge class
  const getTypeBadgeClass = (type: ServiceType) => {
    switch (type) {
      case ServiceType.CARE:
        return "bg-purple-100 text-purple-800"
      case ServiceType.RITUAL:
        return "bg-indigo-100 text-indigo-800"
      case ServiceType.LOGISTICS:
        return "bg-blue-100 text-blue-800"
      case ServiceType.OTHER:
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-medium pl-2">Services Management</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
                <DialogDescription>Create a new service for a deceased record.</DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="deceasedId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deceased Record</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Casket - Premium Oak" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the service" className="min-h-[80px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CARE">Care</SelectItem>
                              <SelectItem value="RITUAL">Ritual</SelectItem>
                              <SelectItem value="LOGISTICS">Logistics</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost ($)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createServiceMutation.isPending}>
                      {createServiceMutation.isPending ? "Creating..." : "Create Service"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Services</CardTitle>
            <CardDescription>View and manage services for deceased records.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Select Deceased Record
              </label>
              <Select value={selectedDeceasedId} onValueChange={setSelectedDeceasedId}>
                <SelectTrigger className="w-full md:w-[300px] mt-2">
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
              isLoadingServices ? (
                <div className="flex justify-center py-8">
                  <p>Loading services...</p>
                </div>
              ) : services?.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">{service.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeBadgeClass(
                                service.type,
                              )}`}
                            >
                              {service.type}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                                service.status,
                              )}`}
                            >
                              {service.status}
                            </span>
                          </TableCell>
                          <TableCell>${service.cost.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="icon" onClick={() => handleEditService(service)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDeleteClick(service)}
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
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No Services Found</p>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    This deceased record doesn't have any services yet.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>Add Service</Button>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Select a Deceased Record</p>
                <p className="text-sm text-muted-foreground text-center">
                  Please select a deceased record to view and manage its services.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update the details of this service.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CARE">Care</SelectItem>
                          <SelectItem value="RITUAL">Ritual</SelectItem>
                          <SelectItem value="LOGISTICS">Logistics</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateServiceMutation.isPending || !selectedService}
                  onClick={() => {
                    console.log("Update button clicked");
                    console.log("Form state:", editForm.formState);
                    // This is a backup click handler in case form submission fails
                    if (Object.keys(editForm.formState.errors).length === 0) {
                      const data = editForm.getValues();
                      onEditSubmit(data);
                    }
                  }}
                >
                  {updateServiceMutation.isPending ? "Updating..." : "Update Service"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service {selectedService?.name} from the
              system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteService}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteServiceMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}

