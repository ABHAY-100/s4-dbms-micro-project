"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { DashboardLayout } from "@/components/dashboard/layout";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bed, ClipboardList, Heart, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Chamber {
  id: string;
  name: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  capacity: number;
  currentOccupancy: number;
}

interface Deceased {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  chamber?: Chamber;
}

interface ServiceStats {
  _count: {
    _all: number;
  };
  _sum: {
    cost: number;
  };
  status: string;
  type: string;
}

interface Service {
  id: string;
  type: string;
  status: string;
  description: string;
  cost: number;
  deceasedId: string;
  deceased?: {
    firstName: string;
    lastName: string;
  };
}

interface DashboardStats {
  totalChambers: number;
  availableChambers: number;
  totalDeceased: number;
  activeServices: number;
  recentDeceased: Deceased[];
  pendingServices: Service[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalChambers: 0,
    availableChambers: 0,
    totalDeceased: 0,
    activeServices: 0,
    recentDeceased: [],
    pendingServices: [],
  });

  const {
    data: chambersData,
    isLoading: chambersLoading,
    error: chambersError,
    refetch: refetchChambers,
  } = useQuery<Chamber[]>({
    queryKey: ["chambers"],
    queryFn: async () => {
      const response = await axiosInstance.get("/mortuary/chambers/all");
      return response.data;
    },
    retry: 1,
  });

  const {
    data: deceasedData,
    isLoading: deceasedLoading,
    error: deceasedError,
    refetch: refetchDeceased,
  } = useQuery<Deceased[]>({
    queryKey: ["deceased"],
    queryFn: async () => {
      const response = await axiosInstance.get("/mortuary/deceased/all"); // Changed from /deceased/all
      return response.data;
    },
    retry: 1,
  });

  const {
    data: servicesStatsData,
    isLoading: servicesStatsLoading,
    error: servicesStatsError,
    refetch: refetchServicesStats,
  } = useQuery<ServiceStats[]>({
    queryKey: ["servicesStats"],
    queryFn: async () => {
      const response = await axiosInstance.get("/mortuary/services/stats");
      return response.data;
    },
    retry: 1,
  });

  const {
    data: pendingServicesData,
    isLoading: pendingServicesLoading,
    error: pendingServicesError,
    refetch: refetchPendingServices,
  } = useQuery<ServiceStats[]>({
    queryKey: ["pendingServices"],
    queryFn: async () => {
      // Use the correct endpoint
      const response = await axiosInstance.get("/mortuary/services/stats");
      return response.data.filter(
        (stat: ServiceStats) => stat.status === "PENDING"
      );
    },
    retry: 1,
  });

  const handleRetry = async () => {
    if (chambersError) await refetchChambers();
    if (deceasedError) await refetchDeceased();
    if (servicesStatsError) await refetchServicesStats();
    if (pendingServicesError) await refetchPendingServices();
  };

  useEffect(() => {
    if (chambersData && deceasedData) {
      const availableChambers = chambersData.filter(
        (chamber) => chamber.status === "AVAILABLE"
      ).length;

      // Calculate active services count from the stats
      const activeServices =
        servicesStatsData?.reduce((sum, stat) => {
          // Count PENDING services as active
          if (stat.status === "PENDING") {
            return sum + stat._count._all;
          }
          return sum;
        }, 0) || 0;

      // Update stats with the pendingServices stats data
      setStats({
        totalChambers: chambersData.length,
        availableChambers,
        totalDeceased: deceasedData.length,
        activeServices,
        recentDeceased: deceasedData.slice(0, 3), // Changed from 5 to 3
        pendingServices: [], // We'll handle display differently
      });
    }
  }, [chambersData, deceasedData, servicesStatsData]);

  if (
    chambersError ||
    deceasedError ||
    servicesStatsError ||
    pendingServicesError
  ) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Dashboard Error</CardTitle>
              <CardDescription>
                There was a problem loading the dashboard data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {chambersError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-red-700 text-sm">
                    Failed to load chambers data:{" "}
                    {chambersError instanceof Error
                      ? chambersError.message
                      : "Unknown error"}
                  </p>
                </div>
              )}
              {deceasedError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-red-700 text-sm">
                    Failed to load deceased records:{" "}
                    {deceasedError instanceof Error
                      ? deceasedError.message
                      : "Unknown error"}
                  </p>
                </div>
              )}
              {servicesStatsError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-red-700 text-sm">
                    Failed to load services stats:{" "}
                    {servicesStatsError instanceof Error
                      ? servicesStatsError.message
                      : "Unknown error"}
                  </p>
                </div>
              )}
              {pendingServicesError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-red-700 text-sm">
                    Failed to load pending services:{" "}
                    {pendingServicesError instanceof Error
                      ? pendingServicesError.message
                      : "Unknown error"}
                  </p>
                </div>
              )}
              <Button
                onClick={handleRetry}
                disabled={
                  chambersLoading ||
                  deceasedLoading ||
                  servicesStatsLoading ||
                  pendingServicesLoading
                }
                className="w-full"
              >
                {chambersLoading ||
                deceasedLoading ||
                servicesStatsLoading ||
                pendingServicesLoading
                  ? "Retrying..."
                  : "Retry"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-medium pl-2">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Chambers"
            value={stats.totalChambers}
            icon={Bed}
          />
          <StatCard
            title="Available Chambers"
            value={stats.availableChambers}
            icon={Bed}
          />
          <StatCard
            title="Deceased Records"
            value={stats.totalDeceased}
            icon={ClipboardList}
          />
          <StatCard
            title="Active Services"
            value={stats.activeServices}
            icon={Heart}
          />
        </div>

        <Tabs defaultValue="recent">
          <TabsList>
            <TabsTrigger value="recent">Recent Records</TabsTrigger>
            <TabsTrigger value="services">Pending Services</TabsTrigger>
          </TabsList>
          <TabsContent value="recent">
            <Card className="border-2 shadow-none">
              <CardHeader>
                <CardTitle>Recent Deceased Records</CardTitle>
                <CardDescription>
                  The most recently added deceased records in the system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deceasedLoading ? (
                  <p>Loading recent records...</p>
                ) : stats.recentDeceased.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentDeceased.map((deceased) => (
                      <div
                        key={deceased.id}
                        className="flex items-center justify-between border-b pb-2"
                      >
                        <div>
                          <p className="font-medium">
                            {deceased.firstName} {deceased.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Chamber: {deceased.chamber?.name || "Not assigned"}{" "}
                            • Status: {deceased.status}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/deceased`}>View</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No recent records found.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="services">
            <Card className="border-2 shadow-none">
              <CardHeader>
                <CardTitle>Pending Services</CardTitle>
                <CardDescription>
                  Services that need attention or are in progress.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingServicesLoading ? (
                  <p>Loading pending services...</p>
                ) : pendingServicesData && pendingServicesData.length > 0 ? (
                  <div className="space-y-4">
                    {pendingServicesData.map((stat, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b pb-2"
                      >
                        <div>
                          <p className="font-medium capitalize">
                            {stat.type ? stat.type.toLowerCase() : "Unknown"}{" "}
                            Services
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Count: {stat._count._all} •
                            {stat._sum?.cost !== undefined && (
                              <> Total Cost: ${stat._sum.cost.toFixed(2)}</>
                            )}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/services">View All</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No pending services at the moment.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-2 shadow-none">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks you might want to perform
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/deceased/new">Add New Deceased Record</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/chambers">Manage Chambers</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/services">Manage Services</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-2 shadow-none">
            <CardHeader>
              <CardTitle>Chamber Status</CardTitle>
              <CardDescription>Current status of all chambers</CardDescription>
            </CardHeader>
            <CardContent>
              {chambersLoading ? (
                <p>Loading chamber status...</p>
              ) : chambersData?.length > 0 ? (
                <div className="space-y-2">
                  {chambersData.map((chamber) => (
                    <div
                      key={chamber.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            chamber.status === "AVAILABLE"
                              ? "bg-green-500"
                              : chamber.status === "OCCUPIED"
                              ? "bg-red-500"
                              : "bg-amber-500"
                          }`}
                        />
                        <span>Chamber {chamber.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {chamber.currentOccupancy}/{chamber.capacity} units
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No chambers found. Add chambers to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
