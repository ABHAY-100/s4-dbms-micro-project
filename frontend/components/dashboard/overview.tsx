"use client"

import { useAuth } from "@/lib/auth-provider"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Box, Calendar, Clipboard, Loader2 } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"

export function DashboardOverview() {
  const { token } = useAuth()

  const { data: serviceStats, isLoading: statsLoading } = useQuery({
    queryKey: ["serviceStats"],
    queryFn: () => fetchWithAuth("/services/stats", token!),
    enabled: !!token,
  })

  const { data: chambers, isLoading: chambersLoading } = useQuery({
    queryKey: ["chambers"],
    queryFn: () => fetchWithAuth("/chambers/all", token!),
    enabled: !!token,
  })

  const { data: deceasedRecords, isLoading: deceasedLoading } = useQuery({
    queryKey: ["deceased"],
    queryFn: () => fetchWithAuth("/deceased/all", token!),
    enabled: !!token,
  })

  if (statsLoading || chambersLoading || deceasedLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Calculate stats
  const totalChambers = chambers?.length || 0
  const occupiedChambers = chambers?.filter((chamber: any) => chamber.isOccupied)?.length || 0
  const availableChambers = totalChambers - occupiedChambers
  const totalDeceased = deceasedRecords?.length || 0
  const totalServices = serviceStats?.totalServices || 0
  const pendingServices = serviceStats?.pendingServices || 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chambers</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChambers}</div>
            <p className="text-xs text-muted-foreground">{availableChambers} available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deceased Records</CardTitle>
            <Clipboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeceased}</div>
            <p className="text-xs text-muted-foreground">Lifetime records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServices}</div>
            <p className="text-xs text-muted-foreground">{pendingServices} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chamber Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalChambers ? Math.round((occupiedChambers / totalChambers) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">{occupiedChambers} chambers in use</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Complete overview of the mortuary management system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chambers">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chambers">Chambers</TabsTrigger>
              <TabsTrigger value="deceased">Deceased</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
            </TabsList>
            <TabsContent value="chambers" className="space-y-4 pt-4">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {chambers?.slice(0, 4).map((chamber: any) => (
                  <Card key={chamber.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Chamber #{chamber.chamberNumber}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="font-medium">{chamber.isOccupied ? "Occupied" : "Available"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <p className="font-medium">{chamber.type}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="deceased" className="pt-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-4 p-3 text-sm font-medium">
                  <div>Name</div>
                  <div>Age</div>
                  <div>Date of Death</div>
                  <div>Chamber</div>
                </div>
                <div className="divide-y">
                  {deceasedRecords?.slice(0, 5).map((record: any) => (
                    <div key={record.id} className="grid grid-cols-4 p-3 text-sm">
                      <div>{record.fullName}</div>
                      <div>{record.age}</div>
                      <div>{new Date(record.dateOfDeath).toLocaleDateString()}</div>
                      <div>{record.chamberNumber}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="services" className="pt-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-3 p-3 text-sm font-medium">
                  <div>Service Type</div>
                  <div>Date</div>
                  <div>Status</div>
                </div>
                <div className="divide-y">
                  {serviceStats?.recentServices?.map((service: any) => (
                    <div key={service.id} className="grid grid-cols-3 p-3 text-sm">
                      <div>{service.serviceType}</div>
                      <div>{new Date(service.scheduledDate).toLocaleDateString()}</div>
                      <div>{service.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

