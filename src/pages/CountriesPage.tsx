import { useMemo } from "react";
import { useFilters } from "@/contexts/FilterContext";
import { useGscData } from "@/hooks/useGscData";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe } from "lucide-react";

const COUNTRY_NAMES: Record<string, string> = {
  usa: "United States",
  gbr: "United Kingdom",
  deu: "Germany",
  fra: "France",
  grc: "Greece",
  esp: "Spain",
  ita: "Italy",
  // Add more as needed
};

export default function CountriesPage() {
  const { propertyUrl, dateRange, device, setCountry } = useFilters();

  const { data: rows, isLoading } = useGscData({
    propertyUrl,
    startDate: dateRange?.from?.toISOString().split("T")[0] || "",
    endDate: dateRange?.to?.toISOString().split("T")[0] || "",
    device,
  });

  const countries = useMemo(() => {
    if (!rows) return [];

    const map = new Map<string, { clicks: number; impressions: number; positions: number[] }>();

    rows.forEach((r) => {
      if (!r.country) return;
      const c = map.get(r.country) ?? { clicks: 0, impressions: 0, positions: [] };
      c.clicks += r.clicks;
      c.impressions += r.impressions;
      c.positions.push(r.position);
      map.set(r.country, c);
    });

    return [...map.entries()]
      .map(([country, m]) => ({
        country,
        countryName: COUNTRY_NAMES[country.toLowerCase()] || country.toUpperCase(),
        clicks: m.clicks,
        impressions: m.impressions,
        ctr: m.impressions > 0 ? m.clicks / m.impressions : 0,
        position: m.positions.reduce((a, b) => a + b, 0) / m.positions.length,
      }))
      .sort((a, b) => b.clicks - a.clicks);
  }, [rows]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Countries</h1>
        <p className="text-muted-foreground mt-1">
          Performance breakdown by geographic location
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Countries</div>
          <div className="text-2xl font-bold mt-1">{countries.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Clicks</div>
          <div className="text-2xl font-bold mt-1">
            {countries.reduce((sum, c) => sum + c.clicks, 0).toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Top Country</div>
          <div className="text-2xl font-bold mt-1">{countries[0]?.countryName || "-"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avg CTR</div>
          <div className="text-2xl font-bold mt-1">
            {((countries.reduce((sum, c) => sum + c.ctr, 0) / countries.length) * 100).toFixed(2)}%
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Position</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {countries.map((country) => (
              <TableRow key={country.country}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{country.countryName}</span>
                    <span className="text-xs text-muted-foreground">({country.country.toUpperCase()})</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{country.clicks.toLocaleString()}</TableCell>
                <TableCell className="text-right">{country.impressions.toLocaleString()}</TableCell>
                <TableCell className="text-right">{(country.ctr * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-right">{country.position.toFixed(1)}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCountry(country.country)}
                  >
                    Filter to this country
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

