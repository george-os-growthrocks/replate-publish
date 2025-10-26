import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Sparkles } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          scopes: "https://www.googleapis.com/auth/webmasters.readonly",
        },
      });

      if (error) {
        toast.error("Failed to sign in with Google");
        console.error("Auth error:", error);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Sign in error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Powered by Gemini AI</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight">
              Search Console
              <span className="block gradient-primary bg-clip-text text-transparent">
                Visualizer
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Transform Google Search Console data into beautiful charts and actionable SEO insights.
              Because data without decisions is just dashboard décor.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Rich Visualizations</h3>
              <p className="text-sm text-muted-foreground">
                Interactive charts for clicks, CTR, and position trends
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold">AI Insights</h3>
              <p className="text-sm text-muted-foreground">
                Prioritized SEO actions powered by Gemini
              </p>
            </div>
          </div>
        </div>

        <Card className="p-8 shadow-elevated">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold">Get Started</h2>
              <p className="text-muted-foreground">
                Sign in with Google to access your Search Console properties
              </p>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              size="lg"
              className="w-full h-12 text-base"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              We'll request read-only access to your Search Console data.
              Your data is never stored or shared.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
