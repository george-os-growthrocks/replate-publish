import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface PropertySelectorProps {
  onPropertySelect: (property: string) => void;
  selectedProperty: string;
}

const PropertySelector = ({ onPropertySelect, selectedProperty }: PropertySelectorProps) => {
  const [properties, setProperties] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke("gsc-sites");

      if (error) throw error;

      if (data?.sites) {
        const siteUrls = data.sites.map((site: any) => site.siteUrl);
        setProperties(siteUrls);
        if (siteUrls.length > 0 && !selectedProperty) {
          onPropertySelect(siteUrls[0]);
        }
      }
    } catch (error: any) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load Search Console properties");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </Card>
    );
  }

  if (properties.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">No properties found</h3>
        <p className="text-sm text-muted-foreground">
          Make sure you have verified properties in Google Search Console
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Selected Property</p>
            <p className="font-semibold">{selectedProperty || "Select a property"}</p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Change Property
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {properties.map((property) => (
              <DropdownMenuItem
                key={property}
                onClick={() => onPropertySelect(property)}
                className="cursor-pointer"
              >
                {property}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};

export default PropertySelector;
