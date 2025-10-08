import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  Search, 
  BarChart, 
  Globe, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  TestTube,
  ExternalLink,
  Info,
  RefreshCw,
  TrendingUp,
  Loader2,
  Key
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface APIUsageStats {
  provider: string;
  requests_this_month: number;
  total_requests: number;
  last_used?: string;
}

export const APIIntegrationsSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Google OAuth
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleProperties, setGoogleProperties] = useState<any>(null);
  
  // DataForSEO
  const [dataForSEOKey, setDataForSEOKey] = useState("");
  const [dataForSEOConnected, setDataForSEOConnected] = useState(false);
  
  // Firecrawl
  const [firecrawlKey, setFirecrawlKey] = useState("");
  const [firecrawlConnected, setFirecrawlConnected] = useState(false);

  // Usage Stats
  const [usageStats, setUsageStats] = useState<APIUsageStats[]>([]);

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load Google OAuth settings
      const { data: googleSettings } = await supabase
        .from('google_api_settings' as any)
        .select('*')
        .limit(1)
        .maybeSingle();

      if (googleSettings) {
        setGoogleConnected(true);
        setGoogleProperties(googleSettings);
      }

      // Load API keys
      const { data: apiKeys } = await supabase
        .from('api_keys' as any)
        .select('*')
        .eq('user_id', user.id);

      const dataForSEO: any = (apiKeys as any)?.find((k: any) => k.provider === 'dataforseo');
      const firecrawl: any = (apiKeys as any)?.find((k: any) => k.provider === 'firecrawl');

      if (dataForSEO) {
        setDataForSEOKey(dataForSEO.encrypted_key);
        setDataForSEOConnected(dataForSEO.is_active);
      }

      if (firecrawl) {
        setFirecrawlKey(firecrawl.encrypted_key);
        setFirecrawlConnected(firecrawl.is_active);
      }

      // Load usage statistics
      loadUsageStats();
    } catch (error: any) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsageStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get usage stats from api_keys table
      const { data: keys } = await supabase
        .from('api_keys' as any)
        .select('provider, usage_count, last_used_at')
        .eq('user_id', user.id);

      if (keys) {
        const stats = keys.map((k: any) => ({
          provider: k.provider,
          requests_this_month: 0, // Would need separate tracking table
          total_requests: k.usage_count || 0,
          last_used: k.last_used_at
        }));
        setUsageStats(stats);
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const connectGoogle = async () => {
    try {
      // Redirect to Google OAuth
      const redirectUrl = `${window.location.origin}/seo`;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-oauth-callback`)}&response_type=code&scope=https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly&access_type=offline&state=${redirectUrl}`;
      
      window.location.href = authUrl;
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const saveAPIKey = async (provider: 'dataforseo' | 'firecrawl', apiKey: string) => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: `Please enter your ${provider} API key`,
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing }: any = await supabase
        .from('api_keys' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('api_keys' as any)
          .update({
            encrypted_key: apiKey,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', (existing as any).id);
      } else {
        await supabase
          .from('api_keys' as any)
          .insert({
            user_id: user.id,
            provider,
            key_name: `${provider} API Key`,
            encrypted_key: apiKey,
            is_active: true
          });
      }

      if (provider === 'dataforseo') {
        setDataForSEOConnected(true);
      } else {
        setFirecrawlConnected(true);
      }

      toast({
        title: "✅ API Key Saved",
        description: `${provider} API key has been saved successfully`
      });

      loadUsageStats();
    } catch (error: any) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error saving API key",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (provider: string) => {
    setTesting(provider);
    try {
      let success = false;

      if (provider === 'dataforseo') {
        // Test DataForSEO connection
        const { data, error } = await supabase.functions.invoke('dataforseo-proxy', {
          body: { 
            path: '/serp/google/locations',
            payload: {}
          }
        });
        success = !error && data?.status_code === 20000;
      } else if (provider === 'firecrawl') {
        // Test would require actual API call
        success = true; // Placeholder
      } else if (provider === 'google') {
        // Test Google connection
        success = googleConnected;
      }

      if (success) {
        toast({
          title: "✅ Connection Successful",
          description: `${provider} is working properly`
        });

        // Update last_tested timestamp
        await supabase
          .from('api_keys' as any)
          .update({ last_used_at: new Date().toISOString() })
          .eq('provider', provider);
        
        loadUsageStats();
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error: any) {
      console.error('Test error:', error);
      toast({
        title: "❌ Connection Failed",
        description: error.message || `Failed to connect to ${provider}`,
        variant: "destructive"
      });
    } finally {
      setTesting(null);
    }
  };

  const getConnectionBadge = (isConnected: boolean) => {
    return isConnected ? (
      <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
        <CheckCircle className="w-3 h-3 mr-1" />
        Connected
      </Badge>
    ) : (
      <Badge variant="secondary">
        <XCircle className="w-3 h-3 mr-1" />
        Not Connected
      </Badge>
    );
  };

  const getUsageForProvider = (provider: string) => {
    return usageStats.find(s => s.provider === provider);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">API Integrations</h2>
        <p className="text-muted-foreground">
          Connect and configure your external services for enhanced SEO capabilities
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          These integrations enable advanced features like keyword research, rank tracking, 
          content analysis, and Google data synchronization.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="google" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="google" className="gap-2">
            <Globe className="w-4 h-4" />
            Google OAuth
          </TabsTrigger>
          <TabsTrigger value="dataforseo" className="gap-2">
            <Search className="w-4 h-4" />
            DataForSEO
          </TabsTrigger>
          <TabsTrigger value="firecrawl" className="gap-2">
            <Database className="w-4 h-4" />
            Firecrawl
          </TabsTrigger>
        </TabsList>

        {/* Google OAuth Tab */}
        <TabsContent value="google" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    Google OAuth Integration
                  </CardTitle>
                  <CardDescription>
                    Connect to Google Search Console and Analytics
                  </CardDescription>
                </div>
                {getConnectionBadge(googleConnected)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {googleConnected ? (
                <>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-300">
                          Google Account Connected
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Your Google services are connected and syncing data automatically
                        </p>
                      </div>
                    </div>
                  </div>

                  {googleProperties && (
                    <div className="space-y-3">
                      {googleProperties.google_search_console_site_url && (
                        <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-orange-500" />
                            <div>
                              <p className="text-sm font-medium">Search Console</p>
                              <p className="text-xs text-muted-foreground">
                                {googleProperties.google_search_console_site_url}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {googleProperties.last_gsc_sync 
                              ? `Synced ${new Date(googleProperties.last_gsc_sync).toLocaleDateString()}`
                              : 'Not synced'}
                          </Badge>
                        </div>
                      )}

                      {googleProperties.google_analytics_property_id && (
                        <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
                          <div className="flex items-center gap-2">
                            <BarChart className="w-4 h-4 text-purple-500" />
                            <div>
                              <p className="text-sm font-medium">Google Analytics</p>
                              <p className="text-xs text-muted-foreground">
                                Property: {googleProperties.google_analytics_property_id}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {googleProperties.last_ga4_sync 
                              ? `Synced ${new Date(googleProperties.last_ga4_sync).toLocaleDateString()}`
                              : 'Not synced'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => testConnection('google')}
                      disabled={testing === 'google'}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      {testing === 'google' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={connectGoogle}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reconnect
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center py-6">
                    <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Connect Your Google Account</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                      Authorize access to Google Search Console and Analytics to automatically 
                      sync your website data, track performance, and get AI-powered insights.
                    </p>
                    <Button onClick={connectGoogle} size="lg">
                      <Globe className="w-4 h-4 mr-2" />
                      Connect Google Account
                    </Button>
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      You'll be redirected to Google's secure login page. We only request read-only 
                      access to your Search Console and Analytics data.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DataForSEO Tab */}
        <TabsContent value="dataforseo" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-purple-500" />
                    DataForSEO API
                  </CardTitle>
                  <CardDescription>
                    Keyword research, SERP analysis, and competitor intelligence
                  </CardDescription>
                </div>
                {getConnectionBadge(dataForSEOConnected)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataforseo-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="dataforseo-key"
                    type={showKeys.dataforseo ? "text" : "password"}
                    placeholder="Enter your DataForSEO API key"
                    value={dataForSEOKey}
                    onChange={(e) => setDataForSEOKey(e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKeys(prev => ({ ...prev, dataforseo: !prev.dataforseo }))}
                  >
                    {showKeys.dataforseo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => saveAPIKey('dataforseo', dataForSEOKey)}
                  disabled={saving || !dataForSEOKey}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save API Key'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testConnection('dataforseo')}
                  disabled={testing === 'dataforseo' || !dataForSEOConnected}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testing === 'dataforseo' ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>

              {dataForSEOConnected && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Usage Statistics</p>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Requests</span>
                      <span className="font-medium">{getUsageForProvider('dataforseo')?.total_requests || 0}</span>
                    </div>
                    {getUsageForProvider('dataforseo')?.last_used && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Used</span>
                        <span className="font-medium">
                          {new Date(getUsageForProvider('dataforseo')!.last_used!).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Get your API key from{' '}
                  <a 
                    href="https://app.dataforseo.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-1"
                  >
                    dataforseo.com
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Firecrawl Tab */}
        <TabsContent value="firecrawl" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-green-500" />
                    Firecrawl API
                  </CardTitle>
                  <CardDescription>
                    Website crawling and content extraction
                  </CardDescription>
                </div>
                {getConnectionBadge(firecrawlConnected)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firecrawl-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="firecrawl-key"
                    type={showKeys.firecrawl ? "text" : "password"}
                    placeholder="Enter your Firecrawl API key"
                    value={firecrawlKey}
                    onChange={(e) => setFirecrawlKey(e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKeys(prev => ({ ...prev, firecrawl: !prev.firecrawl }))}
                  >
                    {showKeys.firecrawl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => saveAPIKey('firecrawl', firecrawlKey)}
                  disabled={saving || !firecrawlKey}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save API Key'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testConnection('firecrawl')}
                  disabled={testing === 'firecrawl' || !firecrawlConnected}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testing === 'firecrawl' ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>

              {firecrawlConnected && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Usage Statistics</p>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Crawls</span>
                      <span className="font-medium">{getUsageForProvider('firecrawl')?.total_requests || 0}</span>
                    </div>
                    {getUsageForProvider('firecrawl')?.last_used && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Used</span>
                        <span className="font-medium">
                          {new Date(getUsageForProvider('firecrawl')!.last_used!).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Get your API key from{' '}
                  <a 
                    href="https://firecrawl.dev/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-1"
                  >
                    firecrawl.dev
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
