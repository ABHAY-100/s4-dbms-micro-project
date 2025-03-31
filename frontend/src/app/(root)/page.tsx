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

interface DashboardStats {
  totalChambers: number;
  availableChambers: number;
  totalDeceased: number;
  activeServices: number;
  recentDeceased: Deceased[];
  pendingServices: any[];
}

interface ServiceStat {
  status: string;
  type: string;
  _count: {
    _all: number;
  };
  _sum: {
    cost: number | null;
  };
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
      const response = await axiosInstance.get("/mortuary/chambers/all"); // Changed from /chambers/all
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
    data: serviceStatsData,
    isLoading: serviceStatsLoading,
    error: serviceStatsError,
    refetch: refetchServiceStats,
  } = useQuery<ServiceStat[]>({
    queryKey: ["serviceStats"],
    queryFn: async () => {
      const response = await axiosInstance.get("/mortuary/services/stats");
      return response.data;
    },
    retry: 1,
  });

  const handleRetry = async () => {
    if (chambersError) await refetchChambers();
    if (deceasedError) await refetchDeceased();
    if (serviceStatsError) await refetchServiceStats();
  };

  useEffect(() => {
    if (chambersData && deceasedData && serviceStatsData) {
      const availableChambers = chambersData.filter(
        (chamber) => chamber.status === "AVAILABLE"
      ).length;

      // Calculate active services (PENDING or IN_PROGRESS)
      const activeServices = serviceStatsData
        .filter(stat => ["PENDING", "IN_PROGRESS"].includes(stat.status))
        .reduce((sum, stat) => sum + stat._count._all, 0);

      setStats({
        totalChambers: chambersData.length,
        availableChambers,
        totalDeceased: deceasedData.length,
        activeServices,
        recentDeceased: deceasedData.slice(0, 5),
        pendingServices: [],
      });
    }
  }, [chambersData, deceasedData, serviceStatsData]);

  if (chambersError || deceasedError || serviceStatsError) {
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
              {serviceStatsError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-red-700 text-sm">
                    Failed to load service statistics:{" "}
                    {serviceStatsError instanceof Error
                      ? serviceStatsError.message
                      : "Unknown error"}
                  </p>
                </div>
              )}
              <Button
                onClick={handleRetry}
                disabled={chambersLoading || deceasedLoading || serviceStatsLoading}
                className="w-full"
              >
                {chambersLoading || deceasedLoading || serviceStatsLoading ? "Retrying..." : "Retry"}
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
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
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
                          <Link href={`/deceased/${deceased.id}`}>View</Link>
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
                <p className="text-muted-foreground">
                  No pending services at the moment.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="alerts">
            <Card className="border-2 shadow-none">
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>
                  Important notifications that require attention.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <p className="text-sm text-amber-700">
                    {stats.availableChambers === 0
                      ? "No available chambers! Consider adding more capacity."
                      : "No critical alerts at this time."}
                  </p>
                </div>
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
