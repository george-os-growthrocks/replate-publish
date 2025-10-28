import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Phone, Clock, Navigation } from "lucide-react";

interface Business {
  name: string;
  rating: number;
  reviews: number;
  category: string;
  address: string;
  phone?: string;
  hours?: string;
  distance?: string;
}

interface LocalPackProps {
  businesses: Business[];
  searchLocation?: string;
}

export function LocalPack({ businesses, searchLocation }: LocalPackProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-lg">Local results</h3>
        </div>
        {searchLocation && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            {searchLocation}
          </span>
        )}
      </div>

      {/* Map Placeholder */}
      <div className="relative h-40 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-950 dark:to-blue-950 rounded-lg mb-4 overflow-hidden border">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-8 h-8 mx-auto text-red-500 mb-2" />
            <p className="text-xs text-muted-foreground">Map View</p>
          </div>
        </div>
        {/* Pins on map */}
        {businesses.slice(0, 3).map((_, idx) => (
          <div
            key={idx}
            className="absolute bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg"
            style={{
              left: `${30 + idx * 20}%`,
              top: `${40 + idx * 10}%`,
            }}
          >
            {String.fromCharCode(65 + idx)}
          </div>
        ))}
      </div>

      {/* Business Listings */}
      <div className="space-y-4">
        {businesses.map((business, index) => (
          <div
            key={index}
            className="flex gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-500 text-white font-bold rounded-full flex items-center justify-center">
                {String.fromCharCode(65 + index)}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm mb-1 truncate">{business.name}</h4>
              
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{business.rating}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  ({business.reviews} reviews)
                </span>
                {business.distance && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{business.distance}</span>
                  </>
                )}
              </div>

              <Badge variant="secondary" className="text-xs mb-2">
                {business.category}
              </Badge>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{business.address}</p>
                {business.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    {business.phone}
                  </div>
                )}
                {business.hours && (
                  <div className="flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3" />
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {business.hours}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <a 
          href="#" 
          className="text-sm text-primary hover:underline"
          onClick={(e) => e.preventDefault()}
        >
          More places →
        </a>
      </div>
    </Card>
  );
}
