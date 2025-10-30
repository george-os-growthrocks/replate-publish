import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, User, Bell, Database, Palette, CreditCard, Link as LinkIcon, Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";
import { useNavigate } from "react-router-dom";
import PropertySelector from "@/components/dashboard/PropertySelector";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface GSCProperty {
  id: string;
  site_url: string;
  permission_level: string;
}

export default function SettingsPage() {
  const { propertyUrl, setPropertyUrl } = useFilters();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gscProperties, setGscProperties] = useState<GSCProperty[]>([]);

  // Check if Google Search Console is connected
  const { data: isConnected, refetch } = useQuery({
    queryKey: ['gsc-connection-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      setUser(user);

      const { data, error } = await supabase
        .from('user_oauth_tokens')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .maybeSingle();

      const connected = !!data?.access_token;
      
      // Load properties if connected
      if (connected) {
        const { data: properties } = await supabase
          .from('gsc_properties')
          .select('*')
          .eq('user_id', user.id);
        
        if (properties) {
          setGscProperties(properties);
        }
      }

      return connected;
    }
  });

  useEffect(() => {
    // Check if user just returned from Google OAuth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('gsc_connected') === 'true') {
      toast.success('Google Search Console connected successfully!');
      refetch();
      // Clean up URL
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  const handleConnectGSC = async () => {
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please sign in again.");
        navigate("/auth");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gsc-oauth-start?user_id=${encodeURIComponent(user.id)}&redirect_to=settings`;

      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.redirect_url) {
          toast.success('Redirecting to Google...');
          window.location.href = data.redirect_url;
          return;
        }
      }

      throw new Error('Failed to get OAuth URL');
    } catch (error: any) {
      console.error("Error connecting GSC:", error);
      toast.error(error.message || "Failed to connect Google Search Console");
      setIsLoading(false);
    }
  };

  const handleFetchProperties = async () => {
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please sign in again.");
        navigate("/auth");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gsc-sites`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.sites && data.sites.length > 0) {
        await refetch();
        toast.success(`Found ${data.sites.length} properties. Refreshing...`);
      } else {
        toast.warning("No GSC properties found in your account");
      }
    } catch (error: any) {
      console.error("Error fetching properties:", error);
      toast.error(error.message || "Failed to fetch GSC properties");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectGoogle = async () => {
    if (!confirm("Are you sure you want to disconnect Google Search Console? This will remove access to your GSC data.")) {
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_oauth_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google');

      setGscProperties([]);
      toast.success("Google Search Console disconnected");
      refetch();
    } catch (error: any) {
      console.error("Error disconnecting GSC:", error);
      toast.error(error.message || "Failed to disconnect GSC");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your preferences and configuration
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="w-4 h-4 mr-2" />
            Subscription & Credits
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          {/* Google Search Console Connection */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <LinkIcon className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Google Search Console</h3>
              {isConnected && (
                <Badge className="bg-green-500">Connected</Badge>
              )}
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Google Search Console account to access SEO data
              </p>
              {isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900 dark:text-green-100">
                        Google Search Console Connected
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {gscProperties.length} property(ies) connected
                      </p>
                    </div>
                  </div>

                  {gscProperties.length > 0 && (
                    <div className="space-y-2">
                      <Label>Connected Properties:</Label>
                      {gscProperties.map((property) => (
                        <div 
                          key={property.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{property.site_url}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {property.permission_level} access
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleFetchProperties}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Properties
                    </Button>
                    <Button 
                      onClick={handleConnectGSC}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                    >
                      Reconnect
                    </Button>
                    <Button 
                      onClick={disconnectGoogle}
                      variant="destructive"
                      size="sm"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        "Disconnect"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <XCircle className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Not Connected</p>
                      <p className="text-sm text-muted-foreground">
                        Connect your GSC account to access your SEO data
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleConnectGSC} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Connect Google Search Console
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Property Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Property Configuration</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Active Property</Label>
            <PropertySelector
              onPropertySelect={setPropertyUrl}
              selectedProperty={propertyUrl}
            />
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Notifications</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for performance drops
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Get a weekly summary of your Search Console data
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </div>
      </Card>

      {/* Display Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Display Preferences</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Use dark theme across the application
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Compact View</Label>
              <p className="text-sm text-muted-foreground">
                Show more data in tables with reduced spacing
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </div>
      </Card>

      {/* Account Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Account</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label>Plan</Label>
            <p className="text-sm text-muted-foreground mt-1">Free Plan</p>
          </div>
          <Button variant="outline">Upgrade to Pro</Button>
        </div>
      </Card>

      {/* Date Range Presets */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Default Settings</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label>Default Date Range</Label>
            <select className="w-full mt-2 px-3 py-2 border rounded-md" defaultValue="28">
              <option value="7">Last 7 days</option>
              <option value="28">Last 28 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
          <div>
            <Label>Default Device Filter</Label>
            <select className="w-full mt-2 px-3 py-2 border rounded-md" defaultValue="ALL">
              <option value="ALL">All Devices</option>
              <option value="DESKTOP">Desktop</option>
              <option value="MOBILE">Mobile</option>
              <option value="TABLET">Tablet</option>
            </select>
          </div>
        </div>
      </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline">Reset to Defaults</Button>
            <Button>Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Notification Preferences</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Ranking Change Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when rankings change significantly
                  </p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly SEO performance summary
                  </p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Credit Low Warnings</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert when credits drop below 20%
                  </p>
                </div>
                <Switch defaultChecked={true} />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

