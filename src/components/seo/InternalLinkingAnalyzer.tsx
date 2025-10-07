import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2 } from "lucide-react";

export function InternalLinkingAnalyzer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-muted-foreground" />
          Internal Linking Analyzer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Internal linking analysis is temporarily unavailable while database types are being updated.
        </p>
      </CardContent>
    </Card>
  );
}
