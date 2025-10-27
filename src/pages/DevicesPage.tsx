import { useMemo } from "react";
import { useFilters } from "@/contexts/FilterContext";
import { useGscData } from "@/hooks/useGscData";
import { Card } from "@/components/ui/card";
import { Monitor, Smartphone, Tablet, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DevicesPage() {
  const { propertyUrl, dateRange, country } = useFilters();

  const { data: rows, isLoading } = useGscData({
    propertyUrl,
    startDate: dateRange?.from?.toISOString().split("T")[0] || "",
    endDate: dateRange?.to?.toISOString().split("T")[0] || "",
    country,
  });

  const deviceData = useMemo(() => {
    if (!rows) return [];

    const map = new Map<
      string,
      { clicks: number; impressions: number; positions: number[] }
    >();

    rows.forEach((r) => {
      if (!r.device) return;
      const d = map.get(r.device) ?? { clicks: 0, impressions: 0, positions: [] };
      d.clicks += r.clicks;
      d.impressions += r.impressions;
      d.positions.push(r.position);
      map.set(r.device, d);
    });

    return [...map.entries()]
      .map(([device, m]) => ({
        device,
        clicks: m.clicks,
        impressions: m.impressions,
        ctr: m.impressions > 0 ? m.clicks / m.impressions : 0,
        position: m.positions.reduce((a, b) => a + b, 0) / m.positions.length,
      }))
      .sort((a, b) => b.clicks - a.clicks);
  }, [rows]);

  const desktop = deviceData.find((d) => d.device === "DESKTOP");
  const mobile = deviceData.find((d) => d.device === "MOBILE");
  const tablet = deviceData.find((d) => d.device === "TABLET");

  // Calculate deltas (Mobile vs Desktop)
  const ctrDelta = mobile && desktop
    ? ((mobile.ctr - desktop.ctr) / desktop.ctr) * 100
    : 0;
  const positionDelta = mobile && desktop
    ? ((mobile.position - desktop.position) / desktop.position) * 100
    : 0;
  const clicksDelta = mobile && desktop
    ? ((mobile.clicks - desktop.clicks) / desktop.clicks) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const chartData = [
    {
      name: "Clicks",
      Desktop: desktop?.clicks || 0,
      Mobile: mobile?.clicks || 0,
      Tablet: tablet?.clicks || 0,
    },
    {
      name: "Impressions",
      Desktop: desktop?.impressions || 0,
      Mobile: mobile?.impressions || 0,
      Tablet: tablet?.impressions || 0,
    },
  ];

  const performanceData = [
    {
      name: "CTR",
      Desktop: (desktop?.ctr || 0) * 100,
      Mobile: (mobile?.ctr || 0) * 100,
      Tablet: (tablet?.ctr || 0) * 100,
    },
    {
      name: "Position",
      Desktop: desktop?.position || 0,
      Mobile: mobile?.position || 0,
      Tablet: tablet?.position || 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Device Performance</h1>
        <p className="text-muted-foreground mt-1">
          Compare Desktop, Mobile, and Tablet performance
        </p>
      </div>

      {/* Mobile vs Desktop Delta Chips */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Mobile vs Desktop Deltas</h3>
        <div className="flex flex-wrap gap-3">
          <Badge
            variant={ctrDelta > 0 ? "default" : "destructive"}
            className="px-4 py-2 text-sm"
          >
            {ctrDelta > 0 ? <TrendingUp className="h-4 w-4 mr-2" /> : <TrendingDown className="h-4 w-4 mr-2" />}
            CTR: {ctrDelta > 0 ? "+" : ""}{ctrDelta.toFixed(1)}%
          </Badge>
          <Badge
            variant={positionDelta < 0 ? "default" : "destructive"}
            className="px-4 py-2 text-sm"
          >
            {positionDelta < 0 ? <TrendingUp className="h-4 w-4 mr-2" /> : <TrendingDown className="h-4 w-4 mr-2" />}
            Position: {positionDelta > 0 ? "+" : ""}{positionDelta.toFixed(1)}%
          </Badge>
          <Badge
            variant={clicksDelta > 0 ? "default" : "destructive"}
            className="px-4 py-2 text-sm"
          >
            {clicksDelta > 0 ? <TrendingUp className="h-4 w-4 mr-2" /> : <TrendingDown className="h-4 w-4 mr-2" />}
            Clicks: {clicksDelta > 0 ? "+" : ""}{clicksDelta.toFixed(1)}%
          </Badge>
        </div>
      </Card>

      {/* Device KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Desktop */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Monitor className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Desktop</h3>
              <p className="text-sm text-muted-foreground">Traditional</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Clicks</div>
              <div className="text-2xl font-bold">{desktop?.clicks.toLocaleString() || 0}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-muted-foreground">Impr.</div>
                <div className="font-semibold">{(desktop?.impressions || 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">CTR</div>
                <div className="font-semibold">{((desktop?.ctr || 0) * 100).toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Pos</div>
                <div className="font-semibold">{(desktop?.position || 0).toFixed(1)}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Mobile */}
        <Card className="p-6 border-primary">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Mobile</h3>
              <p className="text-sm text-muted-foreground">On-the-go</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Clicks</div>
              <div className="text-2xl font-bold">{mobile?.clicks.toLocaleString() || 0}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-muted-foreground">Impr.</div>
                <div className="font-semibold">{(mobile?.impressions || 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">CTR</div>
                <div className="font-semibold">{((mobile?.ctr || 0) * 100).toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Pos</div>
                <div className="font-semibold">{(mobile?.position || 0).toFixed(1)}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tablet */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Tablet className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Tablet</h3>
              <p className="text-sm text-muted-foreground">Hybrid</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Clicks</div>
              <div className="text-2xl font-bold">{tablet?.clicks.toLocaleString() || 0}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-muted-foreground">Impr.</div>
                <div className="font-semibold">{(tablet?.impressions || 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">CTR</div>
                <div className="font-semibold">{((tablet?.ctr || 0) * 100).toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Pos</div>
                <div className="font-semibold">{(tablet?.position || 0).toFixed(1)}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Clicks & Impressions by Device</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Desktop" fill="#3b82f6" />
              <Bar dataKey="Mobile" fill="#10b981" />
              <Bar dataKey="Tablet" fill="#a855f7" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">CTR & Position by Device</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Desktop" fill="#3b82f6" />
              <Bar dataKey="Mobile" fill="#10b981" />
              <Bar dataKey="Tablet" fill="#a855f7" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Insights */}
      <Card className="p-6 bg-blue-500/5 border-blue-500/20">
        <h3 className="text-lg font-semibold mb-2">Device Insights</h3>
        <div className="space-y-2 text-sm">
          {mobile && desktop && (
            <>
              {mobile.clicks > desktop.clicks && (
                <p>✓ Mobile drives more traffic than desktop - prioritize mobile optimization</p>
              )}
              {mobile.ctr > desktop.ctr && (
                <p>✓ Mobile has higher CTR - mobile meta descriptions are performing well</p>
              )}
              {mobile.position < desktop.position && (
                <p>✓ Mobile ranks better - Google's mobile-first indexing is working in your favor</p>
              )}
              {desktop.ctr > mobile.ctr && (
                <p>⚠ Desktop CTR is higher - consider optimizing mobile meta descriptions</p>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

