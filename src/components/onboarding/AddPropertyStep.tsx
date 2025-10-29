import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OnboardingState } from "./OnboardingWizard";
import { Globe, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AddPropertyStepProps {
  state: OnboardingState;
  onUpdate: (update: Partial<OnboardingState>) => void;
}

export function AddPropertyStep({ state, onUpdate }: AddPropertyStepProps) {
  const [properties, setProperties] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProperties = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching GSC properties...');
      const { data, error: invokeError } = await supabase.functions.invoke('gsc-sites');
      
      console.log('GSC response:', { data, error: invokeError });
      
      if (invokeError) {
        throw new Error(`Function error: ${invokeError.message}`);
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      if (data?.sites && Array.isArray(data.sites)) {
        const siteUrls = data.sites.map((s: { siteUrl: string }) => s.siteUrl);
        console.log('Found properties:', siteUrls);
        setProperties(siteUrls);
        
        // Auto-select first property
        if (siteUrls.length > 0 && !state.selectedProperty) {
          onUpdate({ selectedProperty: siteUrls[0] });
        }
      } else {
        console.warn('No sites found in response');
        setProperties([]);
      }
    } catch (err) {
      console.error('Failed to load properties:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProperty = (property: string) => {
    onUpdate({ selectedProperty: property });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mx-auto mb-4 flex items-center justify-center">
          <Globe className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Select Your Property</h3>
        <p className="text-muted-foreground">
          Choose the website you want to optimize
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : properties.length > 0 ? (
        <div className="space-y-3">
          {properties.map((property) => (
            <Card
              key={property}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                state.selectedProperty === property
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : "hover:border-primary/50"
              }`}
              onClick={() => handleSelectProperty(property)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    state.selectedProperty === property ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <Globe className={`w-5 h-5 ${
                      state.selectedProperty === property ? "text-primary" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{property}</p>
                    <p className="text-xs text-muted-foreground">Google Search Console Property</p>
                  </div>
                </div>
                {state.selectedProperty === property && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h4 className="font-semibold mb-2">No Properties Found</h4>
          <p className="text-sm text-muted-foreground mb-4">
            We couldn't find any properties in your Google Search Console.
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-xs text-red-800 dark:text-red-200 font-medium mb-1">Error Details:</p>
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          <div className="space-y-2 text-left mb-4 p-4 bg-muted/50 rounded-lg text-xs">
            <p className="font-semibold">Possible solutions:</p>
            <ul className="space-y-1 list-disc list-inside text-muted-foreground">
              <li>Make sure you have at least one property added in <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Search Console</a></li>
              <li>Sign out and sign back in to refresh your connection</li>
              <li>Check that you authorized with the correct Google account</li>
            </ul>
          </div>
          <Button variant="outline" onClick={loadProperties}>
            Retry
          </Button>
        </Card>
      )}

      {state.selectedProperty && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm font-medium text-primary">
            ✓ Selected: {state.selectedProperty}
          </p>
        </div>
      )}
    </div>
  );
}
