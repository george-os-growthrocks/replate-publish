import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

interface KeywordOpportunityAnalyzerProps {
  projectId: string;
}

export function KeywordOpportunityAnalyzer({ projectId }: KeywordOpportunityAnalyzerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          Keyword Opportunity Analyzer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Keyword opportunity analysis is temporarily unavailable while database types are being updated.
        </p>
      </CardContent>
    </Card>
  );
}
