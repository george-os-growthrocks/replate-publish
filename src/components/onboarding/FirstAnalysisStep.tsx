import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OnboardingState } from "./OnboardingWizard";
import { Sparkles, BarChart3, CheckCircle2, Loader2 } from "lucide-react";

interface FirstAnalysisStepProps {
  state: OnboardingState;
  onUpdate: (update: Partial<OnboardingState>) => void;
}

export function FirstAnalysisStep({ state, onUpdate }: FirstAnalysisStepProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis (in real app, this would call actual APIs)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onUpdate({ completedAnalysis: true });
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-4 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Run Your First Analysis</h3>
        <p className="text-muted-foreground">
          Get instant insights into your SEO performance
        </p>
      </div>

      {!state.completedAnalysis ? (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 mx-auto mb-3 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <h4 className="font-semibold text-sm mb-1">Traffic Analysis</h4>
              <p className="text-xs text-muted-foreground">
                See how users find your site
              </p>
            </Card>

            <Card className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 mx-auto mb-3 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-green-500" />
              </div>
              <h4 className="font-semibold text-sm mb-1">Top Keywords</h4>
              <p className="text-xs text-muted-foreground">
                Discover your best performers
              </p>
            </Card>

            <Card className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 mx-auto mb-3 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-amber-500" />
              </div>
              <h4 className="font-semibold text-sm mb-1">Quick Wins</h4>
              <p className="text-xs text-muted-foreground">
                Get actionable recommendations
              </p>
            </Card>
          </div>

          <Button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || !state.selectedProperty}
            className="w-full gradient-primary"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run Quick Analysis
              </>
            )}
          </Button>

          {!state.selectedProperty && (
            <p className="text-xs text-center text-muted-foreground">
              Please select a property in the previous step to run analysis
            </p>
          )}
        </>
      ) : (
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h4 className="font-semibold text-lg mb-2">Analysis Complete!</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Your SEO data has been analyzed. Here's what we found:
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-primary">156</p>
                <p className="text-xs text-muted-foreground">Keywords</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-green-500">12.5K</p>
                <p className="text-xs text-muted-foreground">Clicks/mo</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-amber-500">23</p>
                <p className="text-xs text-muted-foreground">Opportunities</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              View detailed insights in your dashboard after setup
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
