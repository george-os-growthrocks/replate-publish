import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe,
  BarChart3,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GooglePropertySelectorProps {
  projectId: string;
  onComplete?: () => void;
}

interface GSCProperty {
  siteUrl: string;
  permissionLevel: string;
}

interface GA4Property {
  name: string;
  displayName: string;
}

export default function GooglePropertySelector({ projectId, onComplete }: GooglePropertySelectorProps) {
  const [loading, setLoading] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [gscProperties, setGscProperties] = useState<GSCProperty[]>([]);
  const [ga4Properties, setGA4Properties] = useState<GA4Property[]>([]);
  const [selectedGSC, setSelectedGSC] = useState<string>("");
  const [selectedGA4, setSelectedGA4] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [projectId]);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('google_api_settings')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Error loading settings:', error);
      return;
    }

    if (data) {
      setIsConnected(!!data.credentials_json);
      setSelectedGSC(data.google_search_console_site_url || "");
      setSelectedGA4(data.google_analytics_property_id || "");
      
      // Load properties from metadata if available
      const creds = data.credentials_json as any;
      if (creds?.gsc_properties) {
        setGscProperties(creds.gsc_properties);
      }
      if (creds?.ga4_properties) {
        setGA4Properties(creds.ga4_properties);
      }
    }
  };

  const initiateGoogleOAuth = async () => {
    setAuthenticating(true);
    
    try {
      const redirectUri = `${window.location.origin}/google-oauth-callback.html`;
      const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
      
      if (!clientId) {
        toast({
          title: "Configuration Error",
          description: "Google OAuth client ID is not configured",
          variant: "destructive",
        });
        return;
      }

      const scopes = [
        'https://www.googleapis.com/auth/webmasters.readonly',
        'https://www.googleapis.com/auth/analytics.readonly'
      ].join(' ');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${projectId}`;

      const popup = window.open(authUrl, 'google-oauth', 'width=600,height=600');

      // Listen for OAuth completion
      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
          popup?.close();
          window.removeEventListener('message', messageListener);
          
          const { code } = event.data;
          
          // Exchange code for tokens and get properties
          const { data: oauthData, error: oauthError } = await supabase.functions.invoke(
            'google-oauth-callback',
            {
              body: { 
                code, 
                projectId, 
                redirectUri,
                refreshOnly: false 
              }
            }
          );

          if (oauthError || !oauthData) {
            toast({
              title: "OAuth Failed",
              description: oauthError?.message || "Failed to authenticate with Google",
              variant: "destructive",
            });
            return;
          }

          // Update state with fetched properties
          setGscProperties(oauthData.gscProperties || []);
          setGA4Properties(oauthData.gaProperties || []);
          setIsConnected(true);

          toast({
            title: "Google Connected! ✅",
            description: "Now select your properties below",
          });
          
          loadSettings();
        } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
          popup?.close();
          window.removeEventListener('message', messageListener);
          toast({
            title: "OAuth Failed",
            description: event.data.error || "Failed to authenticate with Google",
            variant: "destructive",
          });
        }
      };

      window.addEventListener('message', messageListener);
      
      // Cleanup after 5 minutes
      setTimeout(() => {
        window.removeEventListener('message', messageListener);
        if (popup && !popup.closed) {
          popup.close();
        }
      }, 300000);

    } catch (error: any) {
      console.error('OAuth error:', error);
      toast({
        title: "OAuth Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAuthenticating(false);
    }
  };

  const savePropertySelections = async () => {
    if (!selectedGSC && !selectedGA4) {
      toast({
        title: "No Selection",
        description: "Please select at least one property",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('google_api_settings')
        .update({
          google_search_console_site_url: selectedGSC,
          google_analytics_property_id: selectedGA4,
        })
        .eq('project_id', projectId);

      if (error) throw error;

      toast({
        title: "Properties Saved! ✅",
        description: "Your Google properties have been linked to this project",
      });

      onComplete?.();
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Google Account Connection</span>
            {isConnected ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Not Connected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Connect your Google account to access Search Console and Analytics data
              </p>
              <Button 
                onClick={initiateGoogleOAuth} 
                disabled={authenticating}
                size="lg"
                className="gap-2"
              >
                {authenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    Connect Google Account
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Google account connected</span>
              </div>
              <Button 
                onClick={initiateGoogleOAuth} 
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reconnect
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Selectors */}
      {isConnected && (gscProperties.length > 0 || ga4Properties.length > 0) && (
        <>
          {/* Search Console Property */}
          {gscProperties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Google Search Console Property
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedGSC} onValueChange={setSelectedGSC}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Search Console property" />
                  </SelectTrigger>
                  <SelectContent>
                    {gscProperties.map((property) => (
                      <SelectItem key={property.siteUrl} value={property.siteUrl}>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <span>{property.siteUrl}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {property.permissionLevel}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedGSC && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Selected: {selectedGSC}</span>
                    <a 
                      href={`https://search.google.com/search-console?resource_id=${encodeURIComponent(selectedGSC)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-1 hover:text-primary"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View in GSC
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Google Analytics Property */}
          {ga4Properties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                  Google Analytics 4 Property
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedGA4} onValueChange={setSelectedGA4}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Google Analytics property" />
                  </SelectTrigger>
                  <SelectContent>
                    {ga4Properties.map((property) => (
                      <SelectItem key={property.name} value={property.name.split('/').pop() || property.name}>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          <span>{property.displayName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedGA4 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Property ID: {selectedGA4}</span>
                    <a 
                      href="https://analytics.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-1 hover:text-primary"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View in GA4
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={savePropertySelections} 
              disabled={loading || (!selectedGSC && !selectedGA4)}
              size="lg"
              className="gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save Property Selections
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
