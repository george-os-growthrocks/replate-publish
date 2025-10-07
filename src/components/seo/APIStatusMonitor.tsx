import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function APIStatusMonitor() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          API Status Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          API monitoring is temporarily unavailable while database types are being updated.
        </p>
      </CardContent>
    </Card>
  );
}
