import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import PropertySelector from "@/components/dashboard/PropertySelector";
import MetricsOverview from "@/components/dashboard/MetricsOverview";
import TimeSeriesChart from "@/components/dashboard/TimeSeriesChart";
import QueryTable from "@/components/dashboard/QueryTable";
import InsightsPanel from "@/components/dashboard/InsightsPanel";
import { Session } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/");
      } else {
        setSession(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/");
      } else if (session) {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
      console.error("Sign out error:", error);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">SC</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Search Console Visualizer</h1>
              <p className="text-sm text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground mt-1">
              Analyze your Search Console data and get AI-powered insights
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsLoading(true)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>

        <PropertySelector
          onPropertySelect={setSelectedProperty}
          selectedProperty={selectedProperty}
        />

        {selectedProperty && (
          <>
            <MetricsOverview propertyUrl={selectedProperty} />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <TimeSeriesChart propertyUrl={selectedProperty} />
                <QueryTable propertyUrl={selectedProperty} />
              </div>
              <div>
                <InsightsPanel propertyUrl={selectedProperty} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
