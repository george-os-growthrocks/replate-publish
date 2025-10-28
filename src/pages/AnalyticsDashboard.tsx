import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, Eye, Clock, MousePointerClick, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface GA4Property {
  propertyId: string;
  propertyName: string;
  accountName: string;
}

interface GA4ReportData {
  rows?: Array<{
    dimensionValues?: Array<{ value: string }>;
    metricValues?: Array<{ value: string }>;
  }>;
  totals?: Array<{
    metricValues?: Array<{ value: string }>;
  }>;
  rowCount?: number;
}

export default function AnalyticsDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<GA4Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [dateRange, setDateRange] = useState("last7days");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<GA4ReportData | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // Fetch user's GA4 properties
  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ga4-list-properties`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (error.needsAuth) {
          setNeedsAuth(true);
          toast.error("Please connect your Google Analytics account");
        }
        throw new Error(error.error || 'Failed to fetch properties');
      }

      const data = await response.json();
      setProperties(data.properties || []);
      
      // Auto-select first property
      if (data.properties && data.properties.length > 0) {
        setSelectedProperty(data.properties[0].propertyId);
      }
    } catch (error: unknown) {
      console.error('Error fetching properties:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load properties";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (reportType: string) => {
    if (!selectedProperty) {
      toast.error("Please select a property first");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ga4-fetch-report`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propertyId: selectedProperty,
            reportType,
            dateRange,
            userId: user?.id
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (error.needsAuth) {
          setNeedsAuth(true);
          toast.error("Please reconnect your Google Analytics");
        }
        throw new Error(error.error || 'Failed to fetch report');
      }

      const data = await response.json();
      setReportData(data.data);
      
      if (data.cached) {
        toast.success("Report loaded (cached data)");
      } else {
        toast.success("Report loaded successfully");
      }
    } catch (error: unknown) {
      console.error('Error fetching report:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load report";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleAnalytics = () => {
    // Redirect to OAuth settings
    window.location.href = "/settings?tab=integrations";
  };

  if (needsAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <BarChart3 className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Connect Google Analytics</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Connect your Google Analytics account to view detailed traffic and engagement data for your properties.
        </p>
        <Button onClick={connectGoogleAnalytics} size="lg">
          Connect Google Analytics
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Google Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          View detailed traffic analytics and user behavior from your GA4 properties
        </p>
      </div>

      {/* Property Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Select Property & Date Range
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">GA4 Property</label>
              {properties.length === 0 ? (
                <Button
                  onClick={fetchProperties}
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load Properties"}
                </Button>
              ) : (
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((prop) => (
                      <SelectItem key={prop.propertyId} value={prop.propertyId}>
                        {prop.propertyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="last90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => fetchReport('traffic')}
                className="w-full"
                disabled={loading || !selectedProperty}
              >
                {loading ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Loading...</>
                ) : (
                  <><BarChart3 className="w-4 h-4 mr-2" />Load Analytics</>
                )}
              </Button>
            </div>
          </div>

          {properties.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{properties.length} properties available</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchProperties}
                disabled={loading}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Data */}
      {reportData && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pages" onClick={() => fetchReport('pages')}>
              Pages
            </TabsTrigger>
            <TabsTrigger value="events" onClick={() => fetchReport('events')}>
              Events
            </TabsTrigger>
            <TabsTrigger value="sources" onClick={() => fetchReport('sources')}>
              Sources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportData.rowCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total active users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-green-500" />
                    Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportData.rows?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total sessions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    Page Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportData.totals?.[0]?.metricValues?.[2]?.value || '0'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total page views
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    Avg. Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(parseFloat(reportData.totals?.[0]?.metricValues?.[3]?.value || '0'))}s
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Duration per session
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Data Table */}
            <Card>
              <CardHeader>
                <CardTitle>Traffic Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.rows && reportData.rows.length > 0 ? (
                  <div className="space-y-2">
                    {reportData.rows.slice(0, 10).map((row, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">
                            {row.dimensionValues?.[0]?.value || 'Unknown'}
                          </p>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">Users</p>
                            <p className="font-medium">{row.metricValues?.[0]?.value || 0}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground text-xs">Sessions</p>
                            <p className="font-medium">{row.metricValues?.[1]?.value || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No data available for this period
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click "Load Analytics" to fetch page data
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Top Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click "Load Analytics" to fetch event data
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click "Load Analytics" to fetch source data
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!reportData && !loading && selectedProperty && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Ready to Load Analytics</h3>
            <p className="text-muted-foreground mb-4">
              Click "Load Analytics" button above to fetch your GA4 data
            </p>
            <Badge variant="outline">
              {dateRange === 'last7days' ? 'Last 7 Days' :
               dateRange === 'last30days' ? 'Last 30 Days' :
               dateRange === 'last90days' ? 'Last 90 Days' :
               dateRange === 'today' ? 'Today' :
               'Yesterday'}
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
