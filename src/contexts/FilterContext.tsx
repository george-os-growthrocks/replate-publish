import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DateRange } from "react-day-picker";

interface FilterContextType {
  propertyUrl: string;
  setPropertyUrl: (url: string) => void;
  selectedProperty: string; // Alias for consistency
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  country: string;
  setCountry: (country: string) => void;
  device: "ALL" | "DESKTOP" | "MOBILE" | "TABLET";
  setDevice: (device: "ALL" | "DESKTOP" | "MOBILE" | "TABLET") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [propertyUrl, setPropertyUrl] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 28);
    return { from: start, to: end };
  });
  const [country, setCountry] = useState<string>("ALL");
  const [device, setDevice] = useState<"ALL" | "DESKTOP" | "MOBILE" | "TABLET">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Load saved property from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('anotherseo_filter_property');
    if (saved) {
      setPropertyUrl(saved);
    }
  }, []);

  // Save to localStorage whenever property changes
  useEffect(() => {
    if (propertyUrl) {
      localStorage.setItem('anotherseo_filter_property', propertyUrl);
      localStorage.setItem('anotherseo_selected_property', propertyUrl);
      // Trigger storage event for other components (like chatbot)
      window.dispatchEvent(new Event('storage'));
    }
  }, [propertyUrl]);

  return (
    <FilterContext.Provider
      value={{
        propertyUrl,
        setPropertyUrl,
        selectedProperty: propertyUrl, // Alias for consistency
        dateRange,
        setDateRange,
        country,
        setCountry,
        device,
        setDevice,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within FilterProvider");
  }
  return context;
}

