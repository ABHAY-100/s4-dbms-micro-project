"use client";

import { useEffect, useState, useMemo } from "react";
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
import { 
  Chamber, 
  DeceasedRecord, 
  ServiceStats, 
  DashboardStats, 
  QueryError 
} from "@/types";

// Constants
const API_ENDPOINTS = {
  CHAMBERS: "/mortuary/chambers/all",
  DECEASED: "/mortuary/deceased/all",
  SERVICES_STATS: "/mortuary/services/stats"
};

// Initial dashboard state
const INITIAL_DASHBOARD_STATS: DashboardStats = {
  totalChambers: 0,
  availableChambers: 0,
  totalDeceased: 0,
  activeServices: 0,
  recentDeceased: [],
  pendingServices: []
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(INITIAL_DASHBOARD_STATS);

  // Chamber data query
  const {
    data: chambersData,
    isLoading: chambersLoading,
    error: chambersError,
    refetch: refetchChambers,
  } = useQuery<Chamber[], QueryError>({
    queryKey: ["chambers"],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.CHAMBERS);
      return response.data;
    },
    retry: 1,
  });

  // Deceased data query
  const {
    data: deceasedData,
    isLoading: deceasedLoading,
    error: deceasedError,
    refetch: refetchDeceased,
  } = useQuery<DeceasedRecord[], QueryError>({
    queryKey: ["deceased"],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.DECEASED);
      return response.data;
    },
    retry: 1,
  });

  // Services stats query
  const {
    data: servicesStatsData,
    isLoading: servicesStatsLoading,
    error: servicesStatsError,
    refetch: refetchServicesStats,
  } = useQuery<ServiceStats[], QueryError>({
    queryKey: ["servicesStats"],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.SERVICES_STATS);
      return response.data;
    },
    retry: 1,
  });

  // Memoize pending services data to avoid recreating on each render
  const pendingServicesData = useMemo(() => 
    servicesStatsData?.filter(stat => stat.status === "PENDING") || [],
    [servicesStatsData]
  );
  
  const pendingServicesLoading = servicesStatsLoading;

  // Retry all queries on error
  const handleRetry = async () => {
    const promises = [];
    if (chambersError) promises.push(refetchChambers());
    if (deceasedError) promises.push(refetchDeceased());
    if (servicesStatsError) promises.push(refetchServicesStats());
    
    await Promise.all(promises);
  };

  // Update dashboard stats when data changes
  useEffect(() => {
    if (!chambersData || !deceasedData || !servicesStatsData) return;

    const availableChambers = chambersData.filter(
      (chamber) => chamber.status === "AVAILABLE"
    ).length;

    // Calculate active services count from the stats
    const activeServices = servicesStatsData.reduce((sum, stat) => {
      return stat.status === "PENDING" ? sum + stat._count._all : sum;
    }, 0);

    setStats({
      totalChambers: chambersData?.length || 0,
      availableChambers,
      totalDeceased: deceasedData?.length || 0,
      activeServices,
      recentDeceased: deceasedData.slice(0, 3),
      pendingServices: pendingServicesData,
    });
  }, [chambersData, deceasedData, servicesStatsData, pendingServicesData]);

  // Determine if there are any errors
  const hasErrors = chambersError || deceasedError || servicesStatsError;
  
  // Determine if any data is loading
  const isLoading = chambersLoading || deceasedLoading || servicesStatsLoading;

  // Helper to extract error message
  const getErrorMessage = (error: QueryError): string => {
    return error instanceof Error ? error.message : "Unknown error";
  };

  if (hasErrors) {
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
                    Failed to load chambers data: {getErrorMessage(chambersError)}
                  </p>
                </div>
              )}
              {deceasedError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-red-700 text-sm">
                    Failed to load deceased records: {getErrorMessage(deceasedError)}
                  </p>
                </div>
              )}
              {servicesStatsError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-red-700 text-sm">
                    Failed to load services stats: {getErrorMessage(servicesStatsError)}
                  </p>
                </div>
              )}
              <Button
                onClick={handleRetry}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Retrying..." : "Retry"}
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
                {pendingServicesLoading ? (
                  <p>Loading pending services...</p>
                ) : pendingServicesData.length > 0 ? (
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
                            Count: {stat._count._all}
                            {stat._sum?.cost !== undefined && (
                              <> • Total Cost: ${stat._sum.cost.toFixed(2)}</>
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
              ) : chambersData.length > 0 ? (
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
