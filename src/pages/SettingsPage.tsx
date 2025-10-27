import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, User, Bell, Database, Palette } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";
import PropertySelector from "@/components/dashboard/PropertySelector";

export default function SettingsPage() {
  const { propertyUrl, setPropertyUrl } = useFilters();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your preferences and configuration
        </p>
      </div>

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
    </div>
  );
}

