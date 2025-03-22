"use client"

import { useQuery } from "@tanstack/react-query"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/dashboard/stat-card"
import { Bed, ClipboardList, Heart, DollarSign } from "lucide-react"

export default function StatisticsPage() {
  // This would be real API calls to get statistics
  // For now, we'll use mock queries
  const { data: chamberStats, isLoading: isLoadingChambers } = useQuery({
    queryKey: ["chamberStats"],
    queryFn: async () => {
      // This would be replaced with a real API call
      return {
        totalChambers: 5,
        availableChambers: 2,
        occupiedChambers: 3,
        maintenanceChambers: 0,
        totalCapacity: 50,
        currentOccupancy: 30,
        occupancyRate: 60, // percentage
      }
    },
  })

  const { data: deceasedStats, isLoading: isLoadingDeceased } = useQuery({
    queryKey: ["deceasedStats"],
    queryFn: async () => {
      // This would be replaced with a real API call
      return {
        totalDeceased: 45,
        inFacility: 30,
        released: 10,
        processed: 5,
        averageStayDays: 7.5,
      }
    },
  })

  const { data: serviceStats, isLoading: isLoadingServices } = useQuery({
    queryKey: ["serviceStats"],
    queryFn: async () => {
      // This would be a real API call to get service statistics
      // For now, we'll return mock data
      return {
        totalServices: 60,
        pendingServices: 15,
        inProgressServices: 10,
        completedServices: 30,
        cancelledServices: 5,
        totalRevenue: 45000,
        servicesByType: [
          { type: "CARE", count: 25, revenue: 12500 },
          { type: "RITUAL", count: 20, revenue: 24000 },
          { type: "LOGISTICS", count: 10, revenue: 6000 },
          { type: "OTHER", count: 5, revenue: 2500 },
        ],
      }
    },
  })

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Statistics</h1>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chambers">Chambers</TabsTrigger>
            <TabsTrigger value="deceased">Deceased</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Chambers" value={chamberStats?.totalChambers || 0} icon={Bed} />
              <StatCard title="Deceased Records" value={deceasedStats?.totalDeceased || 0} icon={ClipboardList} />
              <StatCard title="Total Services" value={serviceStats?.totalServices || 0} icon={Heart} />
              <StatCard
                title="Total Revenue"
                value={`$${serviceStats?.totalRevenue?.toLocaleString() || 0}`}
                icon={DollarSign}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Occupancy Overview</CardTitle>
                  <CardDescription>Current chamber occupancy statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingChambers ? (
                    <p>Loading chamber statistics...</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Occupancy Rate</span>
                        <span className="text-sm">{chamberStats?.occupancyRate}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${chamberStats?.occupancyRate}%` }}
                        ></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Available</p>
                          <p className="text-lg font-medium">{chamberStats?.availableChambers} chambers</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Occupied</p>
                          <p className="text-lg font-medium">{chamberStats?.occupiedChambers} chambers</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service Distribution</CardTitle>
                  <CardDescription>Services by type and status</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingServices ? (
                    <p>Loading service statistics...</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Services by Type</p>
                        {serviceStats?.servicesByType.map((service) => (
                          <div key={service.type} className="flex justify-between items-center">
                            <span className="text-sm">{service.type}</span>
                            <span className="text-sm font-medium">{service.count}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 pt-2">
                        <p className="text-sm font-medium">Services by Status</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Pending</span>
                          <span className="text-sm font-medium">{serviceStats?.pendingServices}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">In Progress</span>
                          <span className="text-sm font-medium">{serviceStats?.inProgressServices}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Completed</span>
                          <span className="text-sm font-medium">{serviceStats?.completedServices}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chambers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chamber Statistics</CardTitle>
                <CardDescription>Detailed statistics about chambers and occupancy</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingChambers ? (
                  <p>Loading chamber statistics...</p>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Chambers</p>
                        <p className="text-2xl font-bold">{chamberStats?.totalChambers}</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Capacity</p>
                        <p className="text-2xl font-bold">{chamberStats?.totalCapacity} units</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Current Occupancy</p>
                        <p className="text-2xl font-bold">{chamberStats?.currentOccupancy} units</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Chamber Status Distribution</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            <span className="text-sm">Available</span>
                          </div>
                          <span className="text-sm font-medium">{chamberStats?.availableChambers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-500"></div>
                            <span className="text-sm">Occupied</span>
                          </div>
                          <span className="text-sm font-medium">{chamberStats?.occupiedChambers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                            <span className="text-sm">Maintenance</span>
                          </div>
                          <span className="text-sm font-medium">{chamberStats?.maintenanceChambers}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Occupancy Rate</p>
                      <div className="w-full bg-muted rounded-full h-4">
                        <div
                          className="bg-primary h-4 rounded-full"
                          style={{ width: `${chamberStats?.occupancyRate}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {chamberStats?.occupancyRate}% of total capacity is currently in use
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deceased" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deceased Records Statistics</CardTitle>
                <CardDescription>Detailed statistics about deceased records</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDeceased ? (
                  <p>Loading deceased statistics...</p>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Records</p>
                        <p className="text-2xl font-bold">{deceasedStats?.totalDeceased}</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Currently In Facility</p>
                        <p className="text-2xl font-bold">{deceasedStats?.inFacility}</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Average Stay</p>
                        <p className="text-2xl font-bold">{deceasedStats?.averageStayDays} days</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Record Status Distribution</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                            <span className="text-sm">In Facility</span>
                          </div>
                          <span className="text-sm font-medium">{deceasedStats?.inFacility}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            <span className="text-sm">Released</span>
                          </div>
                          <span className="text-sm font-medium">{deceasedStats?.released}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                            <span className="text-sm">Processed</span>
                          </div>
                          <span className="text-sm font-medium">{deceasedStats?.processed}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Status Distribution</p>
                      <div className="w-full h-8 flex rounded-md overflow-hidden">
                        <div
                          className="bg-blue-500 h-full"
                          style={{ width: `${(deceasedStats?.inFacility / deceasedStats?.totalDeceased) * 100}%` }}
                        ></div>
                        <div
                          className="bg-green-500 h-full"
                          style={{ width: `${(deceasedStats?.released / deceasedStats?.totalDeceased) * 100}%` }}
                        ></div>
                        <div
                          className="bg-gray-500 h-full"
                          style={{ width: `${(deceasedStats?.processed / deceasedStats?.totalDeceased) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>
                          In Facility: {Math.round((deceasedStats?.inFacility / deceasedStats?.totalDeceased) * 100)}%
                        </span>
                        <span>
                          Released: {Math.round((deceasedStats?.released / deceasedStats?.totalDeceased) * 100)}%
                        </span>
                        <span>
                          Processed: {Math.round((deceasedStats?.processed / deceasedStats?.totalDeceased) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Statistics</CardTitle>
                <CardDescription>Detailed statistics about services provided</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingServices ? (
                  <p>Loading service statistics...</p>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Services</p>
                        <p className="text-2xl font-bold">{serviceStats?.totalServices}</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Pending</p>
                        <p className="text-2xl font-bold">{serviceStats?.pendingServices}</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                        <p className="text-2xl font-bold">{serviceStats?.inProgressServices}</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Completed</p>
                        <p className="text-2xl font-bold">{serviceStats?.completedServices}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Revenue by Service Type</p>
                      <div className="space-y-2">
                        {serviceStats?.servicesByType.map((service) => (
                          <div key={service.type} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">{service.type}</span>
                              <span className="text-sm font-medium">${service.revenue.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${(service.revenue / serviceStats.totalRevenue) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Service Status Distribution</p>
                      <div className="w-full h-8 flex rounded-md overflow-hidden">
                        <div
                          className="bg-yellow-500 h-full"
                          style={{ width: `${(serviceStats?.pendingServices / serviceStats?.totalServices) * 100}%` }}
                          title="Pending"
                        ></div>
                        <div
                          className="bg-blue-500 h-full"
                          style={{
                            width: `${(serviceStats?.inProgressServices / serviceStats?.totalServices) * 100}%`,
                          }}
                          title="In Progress"
                        ></div>
                        <div
                          className="bg-green-500 h-full"
                          style={{ width: `${(serviceStats?.completedServices / serviceStats?.totalServices) * 100}%` }}
                          title="Completed"
                        ></div>
                        <div
                          className="bg-red-500 h-full"
                          style={{ width: `${(serviceStats?.cancelledServices / serviceStats?.totalServices) * 100}%` }}
                          title="Cancelled"
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>
                          Pending: {Math.round((serviceStats?.pendingServices / serviceStats?.totalServices) * 100)}%
                        </span>
                        <span>
                          In Progress:{" "}
                          {Math.round((serviceStats?.inProgressServices / serviceStats?.totalServices) * 100)}%
                        </span>
                        <span>
                          Completed: {Math.round((serviceStats?.completedServices / serviceStats?.totalServices) * 100)}
                          %
                        </span>
                        <span>
                          Cancelled: {Math.round((serviceStats?.cancelledServices / serviceStats?.totalServices) * 100)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

