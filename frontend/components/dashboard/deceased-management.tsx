"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchWithAuth, API_BASE_URL } from "@/lib/api"
import { Loader2, Plus, Search, FileText, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const deceasedSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  gender: z.string().min(1, "Gender is required"),
  age: z.string().min(1, "Age is required"),
  dateOfDeath: z.date({
    required_error: "Date of death is required",
  }),
  causeOfDeath: z.string().min(1, "Cause of death is required"),
  chamberId: z.string().min(1, "Chamber is required"),
  additionalNotes: z.string().optional(),

  // Next of kin fields
  nextOfKinName: z.string().min(1, "Next of kin name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactAddress: z.string().min(1, "Contact address is required"),
})

type DeceasedFormValues = z.infer<typeof deceasedSchema>

export function DeceasedManagement() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("deceased")

  const form = useForm<DeceasedFormValues>({
    resolver: zodResolver(deceasedSchema),
    defaultValues: {
      fullName: "",
      gender: "",
      age: "",
      dateOfDeath: new Date(),
      causeOfDeath: "",
      chamberId: "",
      additionalNotes: "",
      nextOfKinName: "",
      relationship: "",
      contactPhone: "",
      contactEmail: "",
      contactAddress: "",
    },
  })

  const { data: deceasedRecords, isLoading: deceasedLoading } = useQuery({
    queryKey: ["deceased"],
    queryFn: () => fetchWithAuth("/deceased/all", token!),
    enabled: !!token,
  })

  const { data: chambers, isLoading: chambersLoading } = useQuery({
    queryKey: ["chambers"],
    queryFn: () => fetchWithAuth("/chambers/all", token!),
    enabled: !!token,
  })

  const createDeceasedMutation = useMutation({
    mutationFn: async (data: DeceasedFormValues) => {
      // First create the deceased record
      const deceasedResponse = await fetch(`${API_BASE_URL}/deceased`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: data.fullName,
          gender: data.gender,
          age: data.age,
          dateOfDeath: data.dateOfDeath,
          causeOfDeath: data.causeOfDeath,
          chamberId: data.chamberId,
          additionalNotes: data.additionalNotes,
        }),
      })

      if (!deceasedResponse.ok) {
        const error = await deceasedResponse.json()
        throw new Error(error.message || "Failed to create deceased record")
      }

      const deceasedData = await deceasedResponse.json()

      // Then create the next of kin record
      const nextOfKinResponse = await fetch(`${API_BASE_URL}/next-of-kin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deceasedId: deceasedData.id,
          name: data.nextOfKinName,
          relationship: data.relationship,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail || undefined,
          contactAddress: data.contactAddress,
        }),
      })

      if (!nextOfKinResponse.ok) {
        const error = await nextOfKinResponse.json()
        throw new Error(error.message || "Failed to create next of kin record")
      }

      return { deceased: deceasedData, nextOfKin: await nextOfKinResponse.json() }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deceased"] })
      toast({
        title: "Record Created",
        description: "Deceased record has been successfully created.",
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

  const { data: nextOfKin, isLoading: nextOfKinLoading } = useQuery({
    queryKey: ["nextOfKin", selectedRecord?.id],
    queryFn: () => fetchWithAuth(`/next-of-kin?deceasedId=${selectedRecord.id}`, token!),
    enabled: !!token && !!selectedRecord?.id,
  })

  const deleteDeceasedMutation = useMutation({
    mutationFn: async (deceasedId: string) => {
      const response = await fetch(`${API_BASE_URL}/deceased`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deceasedId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete record")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deceased"] })
      toast({
        title: "Record Deleted",
        description: "Deceased record has been successfully removed.",
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

  const onSubmit = (data: DeceasedFormValues) => {
    createDeceasedMutation.mutate(data)
  }

  const isLoading = deceasedLoading || chambersLoading || (selectedRecord && nextOfKinLoading)

  if (isLoading && !selectedRecord) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const availableChambers = chambers?.filter((chamber: any) => !chamber.isOccupied) || []

  const filteredRecords =
    deceasedRecords?.filter(
      (record: any) =>
        record.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.causeOfDeath.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Deceased Records</CardTitle>
            <CardDescription>Manage deceased records and next of kin details</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Add New Deceased Record</DialogTitle>
                <DialogDescription>Create a new deceased record with next of kin details.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <Tabs defaultValue="deceased" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="deceased">Deceased Details</TabsTrigger>
                      <TabsTrigger value="nextOfKin">Next of Kin</TabsTrigger>
                    </TabsList>
                    <TabsContent value="deceased" className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="age"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Age</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dateOfDeath"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Date of Death</FormLabel>
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
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="causeOfDeath"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cause of Death</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="chamberId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chamber</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a chamber" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableChambers.length === 0 ? (
                                  <SelectItem value="" disabled>
                                    No available chambers
                                  </SelectItem>
                                ) : (
                                  availableChambers.map((chamber: any) => (
                                    <SelectItem key={chamber.id} value={chamber.id}>
                                      {chamber.chamberNumber} - {chamber.type} ({chamber.location})
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="additionalNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Notes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Any additional information" className="resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="nextOfKin" className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="nextOfKinName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Next of Kin Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="relationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Son, Daughter, Spouse" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="Phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Email (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Email address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="contactAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Address</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Full address" className="resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>

                  <DialogFooter>
                    <Button type="submit" disabled={createDeceasedMutation.isPending}>
                      {createDeceasedMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Record
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
              placeholder="Search records..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="rounded-md border">
            <div className="grid grid-cols-6 p-4 text-sm font-medium border-b">
              <div>Name</div>
              <div>Age/Gender</div>
              <div>Date of Death</div>
              <div>Cause</div>
              <div>Chamber</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y">
              {filteredRecords.map((record: any) => (
                <div key={record.id} className="grid grid-cols-6 p-4 text-sm items-center">
                  <div className="font-medium">{record.fullName}</div>
                  <div>
                    {record.age} / {record.gender}
                  </div>
                  <div>{new Date(record.dateOfDeath).toLocaleDateString()}</div>
                  <div>{record.causeOfDeath}</div>
                  <div>{record.chamberNumber}</div>
                  <div className="flex justify-end gap-2">
                    <Dialog
                      open={selectedRecord?.id === record.id}
                      onOpenChange={(open) => {
                        if (!open) setSelectedRecord(null)
                        else setSelectedRecord(record)
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Deceased Record Details</DialogTitle>
                          <DialogDescription>View full details of the deceased and next of kin.</DialogDescription>
                        </DialogHeader>
                        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="deceased">Deceased Details</TabsTrigger>
                            <TabsTrigger value="nextOfKin">Next of Kin</TabsTrigger>
                          </TabsList>
                          <TabsContent value="deceased" className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium">Full Name</h4>
                                <p className="text-sm">{selectedRecord?.fullName}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">Gender</h4>
                                <p className="text-sm">{selectedRecord?.gender}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium">Age</h4>
                                <p className="text-sm">{selectedRecord?.age}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">Date of Death</h4>
                                <p className="text-sm">
                                  {selectedRecord?.dateOfDeath &&
                                    new Date(selectedRecord.dateOfDeath).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Cause of Death</h4>
                              <p className="text-sm">{selectedRecord?.causeOfDeath}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Chamber</h4>
                              <p className="text-sm">{selectedRecord?.chamberNumber}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Additional Notes</h4>
                              <p className="text-sm">{selectedRecord?.additionalNotes || "None"}</p>
                            </div>
                          </TabsContent>
                          <TabsContent value="nextOfKin" className="space-y-4 pt-4">
                            {nextOfKinLoading ? (
                              <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                            ) : nextOfKin ? (
                              <>
                                <div>
                                  <h4 className="text-sm font-medium">Name</h4>
                                  <p className="text-sm">{nextOfKin.name}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium">Relationship</h4>
                                  <p className="text-sm">{nextOfKin.relationship}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium">Contact Phone</h4>
                                    <p className="text-sm">{nextOfKin.contactPhone}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium">Contact Email</h4>
                                    <p className="text-sm">{nextOfKin.contactEmail || "N/A"}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium">Contact Address</h4>
                                  <p className="text-sm">{nextOfKin.contactAddress}</p>
                                </div>
                              </>
                            ) : (
                              <div className="text-center text-muted-foreground py-6">
                                No next of kin information available
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
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
                            This will permanently delete the record. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteDeceasedMutation.mutate(record.id)}>
                            {deleteDeceasedMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}

              {filteredRecords.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">No records found</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

