import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Globe, ChevronDown, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.provider_token) {
        toast.error("No Google access token. Please sign out and sign in again.");
        return;
      }
      
      const { data, error } = await supabase.functions.invoke("gsc-sites", {
        body: { provider_token: session.provider_token }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error, { duration: 10000 });
        return;
      }

      if (data?.sites && data.sites.length > 0) {
        const siteUrls = data.sites.map((site: any) => site.siteUrl);
        setProperties(siteUrls);
        if (siteUrls.length > 0 && !selectedProperty) {
          onPropertySelect(siteUrls[0]);
        }
      }
    } catch (error: any) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load Search Console properties. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Split properties by type
  const { domainProperties, websiteProperties } = useMemo(() => {
    const domain: string[] = [];
    const website: string[] = [];
    
    properties.forEach((prop) => {
      if (prop.startsWith("sc-domain:")) {
        domain.push(prop);
      } else {
        website.push(prop);
      }
    });
    
    return { domainProperties: domain, websiteProperties: website };
  }, [properties]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-muted border border-border animate-pulse">
        <div className="h-8 w-8 rounded-lg bg-muted-foreground/20" />
        <div className="space-y-1.5 flex-1">
          <div className="h-2.5 w-24 bg-muted-foreground/20 rounded" />
          <div className="h-3 w-48 bg-muted-foreground/20 rounded" />
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
        <Globe className="h-8 w-8 text-red-400 flex-shrink-0" />
        <div className="text-left">
          <h3 className="text-sm font-semibold text-red-200">No properties found</h3>
          <p className="text-xs text-red-300/70">
            Verify properties in Google Search Console first
          </p>
        </div>
      </div>
    );
  }

  const displayProperty = selectedProperty 
    ? selectedProperty.replace("sc-domain:", "").replace("https://", "").replace("http://", "")
    : "Select a property";

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-200">
      {/* Icon */}
      <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg">
        <Globe className="h-4 w-4 text-white" />
      </div>
      
      {/* Property Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase leading-tight">
          Active Property
        </p>
        <p className="text-sm font-semibold text-foreground truncate mt-0.5">
          {displayProperty}
        </p>
      </div>
      
      {/* Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs flex-shrink-0 hover:bg-muted border"
          >
            Switch
            <ChevronDown className="ml-1.5 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[400px] max-h-[70vh] overflow-y-auto">
          {domainProperties.length > 0 && (
            <>
              <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground sticky top-0 bg-popover z-10 border-b border-border/50">
                <Globe className="h-3.5 w-3.5" />
                Domain Properties ({domainProperties.length})
              </DropdownMenuLabel>
              <div className="py-1">
                {domainProperties.map((property) => (
                  <DropdownMenuItem
                    key={property}
                    onClick={() => onPropertySelect(property)}
                    className={cn(
                      "cursor-pointer text-xs font-mono py-2",
                      selectedProperty === property && "bg-indigo-500/10 text-indigo-200"
                    )}
                  >
                    <span className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="truncate">{property.replace("sc-domain:", "")}</span>
                      {selectedProperty === property && (
                        <span className="text-[10px] text-indigo-400 flex-shrink-0">✓ Active</span>
                      )}
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
            </>
          )}
          
          {domainProperties.length > 0 && websiteProperties.length > 0 && (
            <DropdownMenuSeparator />
          )}
          
          {websiteProperties.length > 0 && (
            <>
              <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground sticky top-0 bg-popover z-10 border-b border-border/50">
                <ExternalLink className="h-3.5 w-3.5" />
                URL-Prefix Properties ({websiteProperties.length})
              </DropdownMenuLabel>
              <div className="py-1">
                {websiteProperties.map((property) => (
                  <DropdownMenuItem
                    key={property}
                    onClick={() => onPropertySelect(property)}
                    className={cn(
                      "cursor-pointer text-xs font-mono py-2",
                      selectedProperty === property && "bg-indigo-500/10 text-indigo-200"
                    )}
                  >
                    <span className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="truncate">{property}</span>
                      {selectedProperty === property && (
                        <span className="text-[10px] text-indigo-400 flex-shrink-0">✓ Active</span>
                      )}
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PropertySelector;
