"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchWithAuth, API_BASE_URL } from "@/lib/api"
import { Loader2, Plus, Search, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
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
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const serviceSchema = z.object({
  deceasedId: z.string().min(1, "Deceased record is required"),
  serviceType: z.string().min(1, "Service type is required"),
  scheduledDate: z.date({
    required_error: "Scheduled date is required",
  }),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
  cost: z.string().min(1, "Cost is required"),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

export function ServicesManagement() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      deceasedId: "",
      serviceType: "",
      scheduledDate: new Date(),
      status: "pending",
      notes: "",
      cost: "",
    },
  })

  const { data: deceasedRecords, isLoading: deceasedLoading } = useQuery({
    queryKey: ["deceased"],
    queryFn: () => fetchWithAuth("/deceased/all", token!),
    enabled: !!token,
  })

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      // Since there's no direct endpoint to get all services, we'll get them for each deceased
      if (!deceasedRecords) return []

      const allServices = []
      for (const record of deceasedRecords) {
        try {
          const recordServices = await fetchWithAuth(`/services?deceasedId=${record.id}`, token!)
          if (recordServices && recordServices.length) {
            // Add deceased name to each service for display
            const servicesWithName = recordServices.map((service: any) => ({
              ...service,
              deceasedName: record.fullName,
            }))
            allServices.push(...servicesWithName)
          }
        } catch (error) {
          console.error(`Error fetching services for deceased ${record.id}:`, error)
        }
      }

      return allServices
    },
    enabled: !!token && !!deceasedRecords,
  })

  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      const response = await fetch(`${API_BASE_URL}/services`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create service")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
      toast({
        title: "Service Created",
        description: "New service has been successfully scheduled.",
      })
      setIsAddDialogOpen(false)
      form.reset()
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error.message,
      })
    },
  })

  const updateServiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/services`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serviceId: selectedService.id, ...data }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update service")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
      toast({
        title: "Service Updated",
        description: "Service details have been successfully updated.",
      })
      setSelectedService(null)
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      })
    },
  })

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const response = await fetch(`${API_BASE_URL}/services`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serviceId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete service")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
      toast({
        title: "Service Deleted",
        description: "Service has been successfully removed.",
      })
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error.message,
      })
    },
  })

  const onSubmit = (data: ServiceFormValues) => {
    createServiceMutation.mutate(data)
  }

  const handleEdit = (service: any) => {
    setSelectedService(service)
    form.reset({
      deceasedId: service.deceasedId,
      serviceType: service.serviceType,
      scheduledDate: new Date(service.scheduledDate),
      status: service.status,
      notes: service.notes || "",
      cost: service.cost.toString(),
    })
  }

  const handleUpdateSubmit = (data: ServiceFormValues) => {
    updateServiceMutation.mutate(data)
  }

  const isLoading = deceasedLoading || servicesLoading

  if (isLoading && !services) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const filteredServices =
    services?.filter(
      (service: any) =>
        service.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.deceasedName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.status.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Services</CardTitle>
            <CardDescription>Manage mortuary services and schedules</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Service</DialogTitle>
                <DialogDescription>Create a new mortuary service for a deceased.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="deceasedId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deceased</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select deceased" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {deceasedRecords?.map((record: any) => (
                              <SelectItem key={record.id} value={record.id}>
                                {record.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select service type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="embalming">Embalming</SelectItem>
                            <SelectItem value="cremation">Cremation</SelectItem>
                            <SelectItem value="burial">Burial</SelectItem>
                            <SelectItem value="viewing">Viewing</SelectItem>
                            <SelectItem value="transportation">Transportation</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Scheduled Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className="w-full pl-3 text-left font-normal">
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
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
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any additional information" className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createServiceMutation.isPending}>
                      {createServiceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Schedule Service
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="rounded-md border">
            <div className="grid grid-cols-6 p-4 text-sm font-medium border-b">
              <div>Service Type</div>
              <div>Deceased</div>
              <div>Scheduled Date</div>
              <div>Cost</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y">
              {filteredServices.map((service: any) => (
                <div key={service.id} className="grid grid-cols-6 p-4 text-sm items-center">
                  <div className="font-medium">{service.serviceType}</div>
                  <div>{service.deceasedName}</div>
                  <div>{new Date(service.scheduledDate).toLocaleDateString()}</div>
                  <div>${service.cost}</div>
                  <div>{getStatusBadge(service.status)}</div>
                  <div className="flex justify-end gap-2">
                    <Dialog
                      open={selectedService?.id === service.id}
                      onOpenChange={(open) => !open && setSelectedService(null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Service</DialogTitle>
                          <DialogDescription>Update service details.</DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(handleUpdateSubmit)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="serviceType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Service Type</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select service type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="embalming">Embalming</SelectItem>
                                      <SelectItem value="cremation">Cremation</SelectItem>
                                      <SelectItem value="burial">Burial</SelectItem>
                                      <SelectItem value="viewing">Viewing</SelectItem>
                                      <SelectItem value="transportation">Transportation</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="scheduledDate"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Scheduled Date</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button variant={"outline"} className="w-full pl-3 text-left font-normal">
                                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <CalendarComponent
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
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
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="cost"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cost</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Any additional information"
                                      className="resize-none"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button type="submit" disabled={updateServiceMutation.isPending}>
                                {updateServiceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Service
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the service. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteServiceMutation.mutate(service.id)}>
                            {deleteServiceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}

              {filteredServices.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">No services found</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

