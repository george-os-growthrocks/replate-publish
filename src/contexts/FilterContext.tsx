import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DateRange } from "react-day-picker";

export type DateRangePreset = "last_7_days" | "last_30_days" | "last_90_days" | "this_month" | "last_month" | "custom";

interface FilterContextType {
  propertyUrl: string;
  setPropertyUrl: (url: string) => void;
  selectedProperty: string; // Alias for consistency
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  dateRangePreset: DateRangePreset;
  setDateRangePreset: (preset: DateRangePreset) => void;
  country: string;
  setCountry: (country: string) => void;
  device: "ALL" | "DESKTOP" | "MOBILE" | "TABLET";
  setDevice: (device: "ALL" | "DESKTOP" | "MOBILE" | "TABLET") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Helper function to calculate date ranges based on presets
function calculateDateRange(preset: DateRangePreset): DateRange {
  const now = new Date();
  const end = new Date(now);

  switch (preset) {
    case "last_7_days": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { from: start, to: end };
    }
    case "last_30_days": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { from: start, to: end };
    }
    case "last_90_days": {
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      return { from: start, to: end };
    }
    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start, to: end };
    }
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: start, to: lastMonthEnd };
    }
    case "custom":
    default: {
      const start = new Date(now);
      start.setDate(start.getDate() - 28);
      return { from: start, to: end };
    }
  }
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const [propertyUrl, setPropertyUrl] = useState<string>("");
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("last_30_days");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => calculateDateRange("last_30_days"));
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

  // Update date range when preset changes
  useEffect(() => {
    if (dateRangePreset !== "custom") {
      setDateRange(calculateDateRange(dateRangePreset));
    }
  }, [dateRangePreset]);

  // Custom setDateRangePreset that handles the logic
  const handleSetDateRangePreset = (preset: DateRangePreset) => {
    setDateRangePreset(preset);
    if (preset !== "custom") {
      setDateRange(calculateDateRange(preset));
    }
  };

  return (
    <FilterContext.Provider
      value={{
        propertyUrl,
        setPropertyUrl,
        selectedProperty: propertyUrl, // Alias for consistency
        dateRange,
        setDateRange,
        dateRangePreset,
        setDateRangePreset: handleSetDateRangePreset,
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

