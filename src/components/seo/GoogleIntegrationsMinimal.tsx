import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import GooglePropertySelector from "./GooglePropertySelector";
import { 
  Globe,
  BarChart3,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  ExternalLink
} from "lucide-react";

interface GoogleIntegrationsProps {
  projectId: string;
}

interface GoogleSettings {
  id?: string;
  project_id?: string;
  google_analytics_property_id?: string;
  google_search_console_site_url?: string;
  credentials_json?: any;
  last_ga4_sync?: string;
  last_gsc_sync?: string;
  sync_status?: string;
}

export default function GoogleIntegrations({ projectId }: GoogleIntegrationsProps) {
  const [settings, setSettings] = useState<GoogleSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("connect");
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [projectId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('google_api_settings')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      setSettings(data);
      
      // Switch to status tab if connected
      if (data?.credentials_json) {
        setActiveTab("status");
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
    }
  };

  const disconnectGoogle = async () => {
    try {
      const { error } = await supabase
        .from('google_api_settings')
        .delete()
        .eq('project_id', projectId);

      if (error) throw error;

      setSettings(null);
      setActiveTab("connect");
      
      toast({
        title: "Google Disconnected",
        description: "All Google integrations have been removed",
      });
    } catch (error: any) {
      console.error('Error disconnecting Google:', error);
      toast({
        title: "Disconnect Failed ❌",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const triggerSync = async (service: 'gsc' | 'ga4') => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke(
        service === 'gsc' ? 'fetch-gsc-data' : 'fetch-ga4-data',
        {
          body: { projectId }
        }
      );

      if (error) throw error;

      toast({
        title: `${service.toUpperCase()} Sync Started`,
        description: "Data is syncing in the background",
      });

      loadSettings();
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'syncing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const isConnected = !!settings?.credentials_json;

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Google Integrations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect Search Console and Analytics for powerful insights
          </p>
        </div>
        <div className="flex gap-3">
          {isConnected && (
            <Button
              variant="outline"
              onClick={disconnectGoogle}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Disconnect All
            </Button>
          )}
        </div>
      </div>

      {/* Connection Status Banner */}
      <div className={`rounded-lg border p-4 ${
        isConnected 
          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
          : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
      }`}>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <span className="font-semibold text-green-900 dark:text-green-100">
                  Google Account Connected
                </span>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your Google properties are linked to this project
                </p>
              </div>
              {settings?.sync_status && (
                <Badge className={getStatusColor(settings.sync_status)}>
                  {settings.sync_status}
                </Badge>
              )}
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Not Connected to Google
                </span>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Connect your Google account to access Search Console and Analytics data
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connect">
            {isConnected ? 'Manage Connection' : 'Connect Google'}
          </TabsTrigger>
          <TabsTrigger value="status" disabled={!isConnected}>
            Property Status
          </TabsTrigger>
        </TabsList>

        {/* Connect Tab */}
        <TabsContent value="connect" className="space-y-6">
          <GooglePropertySelector 
            projectId={projectId} 
            onComplete={() => {
              loadSettings();
              setActiveTab("status");
            }}
          />
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-6">
          {/* Google Search Console Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Google Search Console
                </h3>
              </div>
            </div>
            <div className="p-4">
              {settings?.google_search_console_site_url ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {settings.google_search_console_site_url}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Last sync: {settings.last_gsc_sync 
                          ? new Date(settings.last_gsc_sync).toLocaleString() 
                          : 'Never'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Connected
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => triggerSync('gsc')} 
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      Sync Now
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="gap-2"
                      asChild
                    >
                      <a 
                        href={`https://search.google.com/search-console?resource_id=${encodeURIComponent(settings.google_search_console_site_url)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in GSC
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Globe className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No Search Console property selected
                  </p>
                  <Button 
                    onClick={() => setActiveTab("connect")} 
                    variant="link" 
                    className="mt-2"
                  >
                    Select a property
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Google Analytics Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Google Analytics 4
                </h3>
              </div>
            </div>
            <div className="p-4">
              {settings?.google_analytics_property_id ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Property ID: {settings.google_analytics_property_id}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Last sync: {settings.last_ga4_sync 
                          ? new Date(settings.last_ga4_sync).toLocaleString() 
                          : 'Never'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Connected
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => triggerSync('ga4')} 
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      Sync Now
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="gap-2"
                      asChild
                    >
                      <a 
                        href="https://analytics.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in GA4
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No Analytics property selected
                  </p>
                  <Button 
                    onClick={() => setActiveTab("connect")} 
                    variant="link" 
                    className="mt-2"
                  >
                    Select a property
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
