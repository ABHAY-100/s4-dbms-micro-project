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

const chamberSchema = z.object({
  chamberNumber: z.string().min(1, "Chamber number is required"),
  type: z.string().min(1, "Chamber type is required"),
  temperature: z.string().optional(),
  location: z.string().min(1, "Location is required"),
})

type ChamberFormValues = z.infer<typeof chamberSchema>

export function ChambersManagement() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedChamber, setSelectedChamber] = useState<any>(null)

  const form = useForm<ChamberFormValues>({
    resolver: zodResolver(chamberSchema),
    defaultValues: {
      chamberNumber: "",
      type: "refrigerated",
      temperature: "",
      location: "",
    },
  })

  const { data: chambers, isLoading } = useQuery({
    queryKey: ["chambers"],
    queryFn: () => fetchWithAuth("/chambers/all", token!),
    enabled: !!token,
  })

  const createChamberMutation = useMutation({
    mutationFn: async (data: ChamberFormValues) => {
      const response = await fetch(`${API_BASE_URL}/chambers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create chamber")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chambers"] })
      toast({
        title: "Chamber Created",
        description: "New storage chamber has been successfully created.",
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

  const updateChamberMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/chambers`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chamberId: selectedChamber.id, ...data }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update chamber")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chambers"] })
      toast({
        title: "Chamber Updated",
        description: "Chamber details have been successfully updated.",
      })
      setSelectedChamber(null)
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      })
    },
  })

  const deleteChamberMutation = useMutation({
    mutationFn: async (chamberId: string) => {
      const response = await fetch(`${API_BASE_URL}/chambers`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chamberId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete chamber")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chambers"] })
      toast({
        title: "Chamber Deleted",
        description: "Chamber has been successfully removed.",
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

  const onSubmit = (data: ChamberFormValues) => {
    createChamberMutation.mutate(data)
  }

  const handleEdit = (chamber: any) => {
    setSelectedChamber(chamber)
    form.reset({
      chamberNumber: chamber.chamberNumber,
      type: chamber.type,
      temperature: chamber.temperature || "",
      location: chamber.location,
    })
  }

  const handleUpdateSubmit = (data: ChamberFormValues) => {
    updateChamberMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const filteredChambers =
    chambers?.filter(
      (chamber: any) =>
        chamber.chamberNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chamber.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chamber.location.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Storage Chambers</CardTitle>
            <CardDescription>Manage mortuary storage chambers</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Chamber
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Chamber</DialogTitle>
                <DialogDescription>Create a new storage chamber for the mortuary.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="chamberNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chamber Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. C101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chamber Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select chamber type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="refrigerated">Refrigerated</SelectItem>
                            <SelectItem value="freezer">Freezer</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature (°C)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 4°C" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. North Wing, Room 3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createChamberMutation.isPending}>
                      {createChamberMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Chamber
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
              placeholder="Search chambers..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="rounded-md border">
            <div className="grid grid-cols-6 p-4 text-sm font-medium border-b">
              <div>Chamber #</div>
              <div>Type</div>
              <div>Temperature</div>
              <div>Location</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y">
              {filteredChambers.map((chamber: any) => (
                <div key={chamber.id} className="grid grid-cols-6 p-4 text-sm items-center">
                  <div className="font-medium">{chamber.chamberNumber}</div>
                  <div>{chamber.type}</div>
                  <div>{chamber.temperature || "N/A"}</div>
                  <div>{chamber.location}</div>
                  <div>
                    <Badge variant={chamber.isOccupied ? "secondary" : "outline"}>
                      {chamber.isOccupied ? "Occupied" : "Available"}
                    </Badge>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Dialog
                      open={selectedChamber?.id === chamber.id}
                      onOpenChange={(open) => !open && setSelectedChamber(null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(chamber)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Chamber</DialogTitle>
                          <DialogDescription>Update chamber details.</DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(handleUpdateSubmit)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="chamberNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Chamber Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. C101" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Chamber Type</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select chamber type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="refrigerated">Refrigerated</SelectItem>
                                      <SelectItem value="freezer">Freezer</SelectItem>
                                      <SelectItem value="standard">Standard</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="temperature"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Temperature (°C)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. 4°C" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="location"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Location</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. North Wing, Room 3" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button type="submit" disabled={updateChamberMutation.isPending}>
                                {updateChamberMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Chamber
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={chamber.isOccupied}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the chamber. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteChamberMutation.mutate(chamber.id)}>
                            {deleteChamberMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}

              {filteredChambers.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">No chambers found</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

