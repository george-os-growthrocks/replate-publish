import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Link, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GSCProperty {
  siteUrl: string;
  permissionLevel: string;
}

export function GSCPropertiesList() {
  const navigate = useNavigate();

  // Check if Google Search Console is connected
  const { data: isConnected } = useQuery({
    queryKey: ['gsc-connection-status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from('user_oauth_tokens')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .maybeSingle();

      return !!data?.access_token;
    }
  });

  // Fetch GSC properties
  const { data: properties, isLoading } = useQuery({
    queryKey: ['gsc-properties'],
    queryFn: async () => {
      const response = await supabase.functions.invoke('gsc-sites');
      if (response.error) throw response.error;
      return response.data?.sites || [];
    },
    enabled: !!isConnected
  });

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Google Search Console
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Link className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">Connect Your Google Account</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect to Google Search Console to view your properties and SEO data
            </p>
            <Button onClick={() => navigate('/settings')} className="gradient-primary">
              Go to Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Google Search Console Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Your Search Console Properties
          </CardTitle>
          <Badge className="bg-green-500">Connected</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {properties && properties.length > 0 ? (
          <div className="space-y-3">
            {properties.map((property: GSCProperty, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div>
                    <p className="font-medium">{property.siteUrl}</p>
                    <p className="text-sm text-muted-foreground">
                      Permission: {property.permissionLevel}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(property.siteUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No properties found in your Search Console account</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
