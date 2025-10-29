import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OnboardingState } from "./OnboardingWizard";
import { Globe, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConnectGSCStepProps {
  state: OnboardingState;
  onUpdate: (update: Partial<OnboardingState>) => void;
}

export function ConnectGSCStep({ state, onUpdate }: ConnectGSCStepProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/webmasters.readonly',
          redirectTo: `${window.location.origin}/dashboard?onboardingStep=3&gsc=1`,
        },
      });

      if (error) {
        toast.error("Failed to connect to Google");
        console.error(error);
      } else {
        onUpdate({ connectedGSC: true });
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error("Failed to initiate Google connection");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 mx-auto mb-4 flex items-center justify-center">
          <Globe className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Connect Google Search Console</h3>
        <p className="text-muted-foreground">
          Access your search performance data and insights
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Track Your Rankings</h4>
              <p className="text-xs text-muted-foreground">
                Monitor keyword positions and search performance
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Identify Opportunities</h4>
              <p className="text-xs text-muted-foreground">
                Discover keywords and pages with growth potential
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Analyze Trends</h4>
              <p className="text-xs text-muted-foreground">
                Understand traffic patterns and user behavior
              </p>
            </div>
          </div>
        </div>
      </Card>

      {state.connectedGSC ? (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <div>
            <p className="font-semibold text-sm text-green-700 dark:text-green-400">
              Connected Successfully!
            </p>
            <p className="text-xs text-muted-foreground">
              Your Google Search Console is now linked
            </p>
          </div>
        </div>
      ) : (
        <>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full gradient-primary"
            size="lg"
          >
            {isConnecting ? "Connecting..." : "Connect Google Search Console"}
          </Button>

          <div className="p-4 bg-muted/50 border rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              You can skip this step and connect later from Settings. However, many features require GSC access.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
