import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, User, Bell, Database, Palette, CreditCard, Link as LinkIcon } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";
import PropertySelector from "@/components/dashboard/PropertySelector";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { propertyUrl, setPropertyUrl } = useFilters();

  // Check if Google Search Console is connected
  const { data: isConnected, refetch } = useQuery({
    queryKey: ['gsc-connection-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_oauth_tokens')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .maybeSingle();

      return !!data?.access_token;
    }
  });

  const disconnectGoogle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_oauth_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'google');

    refetch();
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
                Your Google Search Console connection is managed through Google Sign-in.
              </p>
              {isConnected ? (
                <div className="flex items-center gap-3">
                  <Button onClick={disconnectGoogle} variant="destructive" size="sm">
                    Disconnect Google
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Your Google Search Console is connected and properties are available
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm mb-2">To connect Google Search Console:</p>
                  <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>1. Sign out of your account</li>
                    <li>2. Sign in again using "Sign in with Google"</li>
                    <li>3. Your properties will automatically appear</li>
                  </ol>
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
            <select className="w-full mt-2 px-3 py-2 border rounded-md">
              <option value="7">Last 7 days</option>
              <option value="28" selected>Last 28 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
          <div>
            <Label>Default Device Filter</Label>
            <select className="w-full mt-2 px-3 py-2 border rounded-md">
              <option value="ALL" selected>All Devices</option>
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

