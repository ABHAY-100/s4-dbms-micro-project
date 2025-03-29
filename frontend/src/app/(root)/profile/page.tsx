"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { UserCircle } from "lucide-react";
import axios from "@/lib/axios";

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  phone: z.string().regex(/^\+\d{12}$/, {
    message: "Phone must be in format: +919999999999",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const passwordFormSchema = z.object({
  currentPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        phone: user.phone || "",
      });
    }
  }, [user, profileForm]);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  async function updateName(name: string) {
    if (name === user?.name) {
      toast.info("No changes", {
        description: "No changes were made to your name.",
      });
      return;
    }

    try {
      setIsUpdating(true);
      const response = await axios.patch("/users/update", { name });

      if (response.data?.user) {
        updateUser(response.data.user);

        profileForm.reset({
          name: response.data.user.name || "",
          phone: response.data.user.phone || "",
        });
      }

      toast.success("Name updated", {
        description: "Your name has been updated successfully.",
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message?.error ||
        error?.response?.data?.message ||
        "Something went wrong";
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setIsUpdating(false);
    }
  }

  async function updatePhone(phone: string) {
    if (phone === user?.phone) {
      toast.info("No changes", {
        description: "No changes were made to your phone number.",
      });
      return;
    }

    try {
      setIsUpdating(true);
      const response = await axios.patch("/users/update", { phone });

      if (response.data?.user) {
        updateUser(response.data.user);

        profileForm.reset({
          name: response.data.user.name || "",
          phone: response.data.user.phone || "",
        });
      }

      toast.success("Phone updated", {
        description: "Your phone number has been updated successfully.",
      });
    } catch (error: any) {
      if (
        error?.response?.data?.message?.error === "Phone number already exists"
      ) {
        toast.error("Phone Number Error", {
          description:
            "This phone number is already in use by another account.",
        });
      } else {
        const errorMessage =
          error?.response?.data?.message?.error ||
          error?.response?.data?.message ||
          "Something went wrong";
        toast.error("Error", {
          description: errorMessage,
        });
      }
    } finally {
      setIsUpdating(false);
    }
  }

  async function onPasswordSubmit(data: PasswordFormValues) {
    if (data.currentPassword === data.newPassword) {
      toast.info("No changes", {
        description: "New password must be different from current password.",
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      await axios.patch("/users/update", {
        password: data.newPassword,
      });

      passwordForm.reset();
      toast.success("Password changed", {
        description: "Your password has been changed successfully.",
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message?.error ||
        error?.response?.data?.message ||
        "Something went wrong";
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setIsChangingPassword(false);
    }
  }

  const nameChanged = profileForm.watch("name") !== user?.name;
  const phoneChanged = profileForm.watch("phone") !== user?.phone;
  const passwordsEntered =
    passwordForm.watch("currentPassword") && passwordForm.watch("newPassword");
  const passwordsValid =
    passwordForm.watch("currentPassword") !==
      passwordForm.watch("newPassword") &&
    passwordForm.watch("currentPassword")?.length >= 8 &&
    passwordForm.watch("newPassword")?.length >= 8;

  return (
    <DashboardLayout>
      <Toaster position="top-right" />
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-medium pl-2">Profile</h1>

        <div className="grid gap-6">
          <Card className="border-2 shadow-none">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-2 mb-4 md:mb-0">
                  <div className="bg-muted rounded-full p-6 w-32 h-32 flex items-center justify-center">
                    <UserCircle className="h-20 w-20 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">
                    {user?.role || "Staff"}
                  </p>
                </div>
                <Form {...profileForm}>
                  <div className="space-y-6 flex-1 w-full">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-1.5 w-full">
                          <FormLabel>Name</FormLabel>
                          <div className="flex gap-3 w-full">
                            <FormControl className="flex-1">
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <Button
                              type="button"
                              onClick={() => updateName(field.value)}
                              disabled={isUpdating || !nameChanged}
                              className="whitespace-nowrap"
                            >
                              {isUpdating ? "Updating..." : "Update Name"}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-1.5 w-full">
                          <FormLabel>Phone</FormLabel>
                          <div className="flex gap-3 w-full">
                            <FormControl className="flex-1">
                              <Input placeholder="+919999999999" {...field} />
                            </FormControl>
                            <Button
                              type="button"
                              onClick={() => updatePhone(field.value)}
                              disabled={isUpdating || !phoneChanged}
                              className="whitespace-nowrap"
                            >
                              {isUpdating ? "Updating..." : "Update Phone"}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-none">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={
                      isChangingPassword || !passwordsEntered || !passwordsValid
                    }
                    className="mt-2"
                  >
                    {isChangingPassword ? "Changing..." : "Change Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
