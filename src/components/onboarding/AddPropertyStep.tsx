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

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('gsc-sites');
      
      if (error) throw error;
      
      if (data?.sites) {
        const siteUrls = data.sites.map((s: { siteUrl: string }) => s.siteUrl);
        setProperties(siteUrls);
        
        // Auto-select first property
        if (siteUrls.length > 0 && !state.selectedProperty) {
          onUpdate({ selectedProperty: siteUrls[0] });
        }
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
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
