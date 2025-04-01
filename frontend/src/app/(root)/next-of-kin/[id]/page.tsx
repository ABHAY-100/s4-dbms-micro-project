"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import Link from "next/link";

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

// Form schema for updating a next of kin
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
});

type NextOfKinFormValues = z.infer<typeof nextOfKinFormSchema>;

export default function NextOfKinDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const kinId = params.id as string;
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deceased, setDeceased] = useState<Deceased | null>(null);

  // Fetch next of kin details
  const {
    data: nextOfKin,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["nextOfKin", kinId],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/mortuary/next-of-kin?kin_id=${kinId}`
      );
      return response.data;
    },
  });

  // Fetch deceased details when next of kin is loaded
  useEffect(() => {
    if (nextOfKin?.deceasedId) {
      const fetchDeceased = async () => {
        try {
          const response = await axiosInstance.get(
            `/mortuary/deceased?deceased_id=${nextOfKin.deceasedId}`
          );
          setDeceased(response.data);
        } catch (error) {
          toast.error("Error", {
            description: "Failed to load deceased details",
          });
        }
      };
      fetchDeceased();
    }
  }, [nextOfKin]);

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
    },
  });

  // Set form values when next of kin is loaded
  useEffect(() => {
    if (nextOfKin) {
      editForm.reset({
        firstName: nextOfKin.firstName,
        lastName: nextOfKin.lastName,
        relationship: nextOfKin.relationship,
        phoneNumber: nextOfKin.phoneNumber,
        email: nextOfKin.email || "",
        address: nextOfKin.address,
      });
    }
  }, [nextOfKin, editForm]);

  // Update next of kin mutation
  const updateNextOfKinMutation = useMutation({
    mutationFn: async (values: NextOfKinFormValues) => {
      const response = await axiosInstance.put(
        `/mortuary/next-of-kin?kin_id=${kinId}`,
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
      queryClient.invalidateQueries({ queryKey: ["nextOfKin", kinId] });
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to update next of kin",
      });
    },
  });

  // Delete next of kin mutation
  const deleteNextOfKinMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.delete(
        `/mortuary/next-of-kin?kin_id=${kinId}`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Next of kin deleted", {
        description: "The next of kin has been deleted successfully.",
      });
      router.push("/next-of-kin");
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "Failed to delete next of kin",
      });
      setIsDeleteDialogOpen(false);
    },
  });

  // Handle edit next of kin form submission
  const onEditSubmit = (data: NextOfKinFormValues) => {
    updateNextOfKinMutation.mutate(data);
  };

  // Handle delete next of kin
  const handleDeleteNextOfKin = () => {
    deleteNextOfKinMutation.mutate();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-medium">Loading...</h1>
          </div>
          <Card>
            <CardContent className="p-8 flex justify-center">
              <p>Loading next of kin details...</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !nextOfKin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-medium">Error</h1>
          </div>
          <Card>
            <CardContent className="p-8 flex justify-center">
              <p>Failed to load next of kin details. Please try again.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.back()}>Go Back</Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-medium">
              {nextOfKin.firstName} {nextOfKin.lastName}
            </h1>
          </div>
          <div className="flex gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Details
                </Button>
              </DialogTrigger>
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
                          <FormLabel>Email</FormLabel>
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

            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the next of kin record for {nextOfKin.firstName}{" "}
                    {nextOfKin.lastName} from the system.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteNextOfKin}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteNextOfKinMutation.isPending
                      ? "Deleting..."
                      : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Next of Kin Details</CardTitle>
            <CardDescription>
              Detailed information about this next of kin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </p>
                </div>
                <p className="text-lg font-medium">
                  {nextOfKin.firstName} {nextOfKin.lastName}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Relationship
                  </p>
                </div>
                <p className="text-lg font-medium">{nextOfKin.relationship}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone Number
                  </p>
                </div>
                <p className="text-lg font-medium">{nextOfKin.phoneNumber}</p>
              </div>

              {nextOfKin.email && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                  </div>
                  <p className="text-lg font-medium">{nextOfKin.email}</p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Address
                </p>
              </div>
              <p className="text-base">{nextOfKin.address}</p>
            </div>

            <Separator />

            {deceased && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Associated Deceased Record
                </h3>
                <div className="border rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Name
                      </p>
                      <p className="font-medium">
                        {deceased.firstName} {deceased.lastName}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Date of Death
                      </p>
                      <p className="font-medium">
                        {format(new Date(deceased.dateOfDeath), "PPP")}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Status
                      </p>
                      <p className="font-medium">{deceased.status}</p>
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/deceased/${deceased.id}`}>
                          View Record
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              Back to Next of Kin List
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
