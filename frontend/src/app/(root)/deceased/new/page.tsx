"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";

const deceasedFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Please enter a valid date of birth.",
  }),
  dateOfDeath: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Please enter a valid date of death.",
  }),
  timeOfDeath: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Please enter a valid time in 24-hour format (HH:MM).",
  }),
  causeOfDeath: z.string().min(2, {
    message: "Cause of death must be at least 2 characters.",
  }),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  chamberId: z.string().min(1, {
    message: "Please select a chamber.",
  }),
  chamberUnitName: z.string().min(1, {
    message: "Chamber unit name is required.",
  }),
  personalBelongings: z.string().optional(),
  identificationMarks: z.string().optional(),
});

type DeceasedFormValues = z.infer<typeof deceasedFormSchema>;

export default function NewDeceasedPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: chambers, isLoading: isLoadingChambers } = useQuery({
    queryKey: ["chambers"],
    queryFn: async () => {
      const response = await axiosInstance.get("/mortuary/chambers/all");
      return response.data.filter((chamber) => chamber.status === "AVAILABLE");
    },
  });

  const form = useForm<DeceasedFormValues>({
    resolver: zodResolver(deceasedFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: format(new Date(), "yyyy-MM-dd"),
      dateOfDeath: format(new Date(), "yyyy-MM-dd"),
      timeOfDeath: format(new Date(), "HH:mm"),
      causeOfDeath: "",
      gender: "MALE",
      chamberId: "",
      chamberUnitName: "",
      personalBelongings: "",
      identificationMarks: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: DeceasedFormValues) => {
      const formattedValues = {
        ...values,
        dateOfBirth: `${values.dateOfBirth}T00:00:00Z`,
        dateOfDeath: `${values.dateOfDeath}T00:00:00Z`,
        personalBelongings: values.personalBelongings
          ? [values.personalBelongings]
          : [],
      };

      const response = await axiosInstance.post(
        "/mortuary/deceased",
        formattedValues
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Record created", {
        description: "The deceased record has been created successfully.",
      });
      router.push("/deceased");
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error("Error", {
        description: error.message || "Failed to create record",
      });
    },
  });

  function onSubmit(data: DeceasedFormValues) {
    setIsSubmitting(true);
    createMutation.mutate(data);
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-medium pl-2">New Deceased Record</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Enter the personal details of the deceased.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfDeath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Death</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timeOfDeath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time of Death</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="causeOfDeath"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Cause of Death</FormLabel>
                        <FormControl>
                          <Input placeholder="Natural causes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Chamber Assignment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="chamberId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chamber</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select chamber" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingChambers ? (
                                <SelectItem value="loading" disabled>
                                  Loading chambers...
                                </SelectItem>
                              ) : chambers?.length > 0 ? (
                                chambers.map((chamber) => (
                                  <SelectItem
                                    key={chamber.id}
                                    value={chamber.id}
                                  >
                                    Chamber {chamber.name} (
                                    {chamber.currentOccupancy}/
                                    {chamber.capacity})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-chambers" disabled>
                                  No available chambers
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select an available chamber for the deceased
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="chamberUnitName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chamber Unit Name</FormLabel>
                          <FormControl>
                            <Input placeholder="A1" {...field} />
                          </FormControl>
                          <FormDescription>
                            A unique identifier for this unit within the chamber
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    <FormField
                      control={form.control}
                      name="personalBelongings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personal Belongings</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List of personal belongings"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            List any personal belongings that came with the
                            deceased
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="identificationMarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Identification Marks</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any distinguishing features or marks"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Note any distinguishing features or marks for
                            identification
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <CardFooter className="flex justify-end px-0">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Record"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
