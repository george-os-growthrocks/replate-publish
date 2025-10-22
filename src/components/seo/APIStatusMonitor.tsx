import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function APIStatusMonitor() {
  // Simplified status display
  const services = [
    { name: "DataForSEO", status: "operational", lastCheck: "2 minutes ago" },
    { name: "Google Search Console", status: "operational", lastCheck: "5 minutes ago" },
    { name: "Google Analytics", status: "operational", lastCheck: "5 minutes ago" },
    { name: "Firecrawl", status: "operational", lastCheck: "3 minutes ago" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          API Status Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">{service.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {service.lastCheck}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                {service.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
