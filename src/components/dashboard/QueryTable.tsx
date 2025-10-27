import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QueryTableProps {
  propertyUrl: string;
  startDate: string;
  endDate: string;
}

const QueryTable = ({ propertyUrl, startDate, endDate }: QueryTableProps) => {
  const [queries, setQueries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"clicks" | "impressions" | "ctr" | "position">("clicks");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchQueries();
  }, [propertyUrl, startDate, endDate]);

  const fetchQueries = async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.provider_token) {
        toast.error("No Google access token. Please sign out and sign in again.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("gsc-query", {
        body: {
          provider_token: session.provider_token,
          siteUrl: propertyUrl,
          startDate,
          endDate,
          dimensions: ["query"],
          rowLimit: 50,
        },
      });

      if (error) throw error;

      if (data?.rows) {
        const formatted = data.rows.map((row: any) => ({
          query: row.keys[0],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: (row.ctr * 100).toFixed(2),
          position: row.position.toFixed(1),
        }));
        setQueries(formatted);
      }
    } catch (error) {
      console.error("Error fetching queries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const sortedQueries = [...queries].sort((a, b) => {
    const aVal = parseFloat(a[sortBy]);
    const bVal = parseFloat(b[sortBy]);
    return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-card">
      <h3 className="text-lg font-semibold mb-6">Top Queries</h3>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Query</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("clicks")}
                  className="h-8 px-2"
                >
                  Clicks
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("impressions")}
                  className="h-8 px-2"
                >
                  Impressions
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("ctr")}
                  className="h-8 px-2"
                >
                  CTR
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("position")}
                  className="h-8 px-2"
                >
                  Position
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedQueries.slice(0, 20).map((query, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium max-w-xs truncate">
                  {query.query}
                </TableCell>
                <TableCell>{query.clicks.toLocaleString()}</TableCell>
                <TableCell>{query.impressions.toLocaleString()}</TableCell>
                <TableCell>{query.ctr}%</TableCell>
                <TableCell>{query.position}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default QueryTable;
