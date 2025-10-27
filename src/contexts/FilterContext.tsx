import { createContext, useContext, useState, ReactNode } from "react";
import { DateRange } from "react-day-picker";

interface FilterContextType {
  propertyUrl: string;
  setPropertyUrl: (url: string) => void;
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

  return (
    <FilterContext.Provider
      value={{
        propertyUrl,
        setPropertyUrl,
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

