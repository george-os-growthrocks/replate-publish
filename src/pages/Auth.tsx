import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Sparkles, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";
import { trackSignup } from "@/lib/utils";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log("Session found, redirecting to dashboard");
        navigate("/dashboard", { replace: true });
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session ? "Session exists" : "No session");
      
      if (event === "SIGNED_IN" && session) {
        console.log("User signed in, attempting to store OAuth token");
        
        // Track signup in Google Analytics
        trackSignup();
        
        // Try to capture and store the provider token
        try {
          const providerToken = session.provider_token;
          const providerRefreshToken = session.provider_refresh_token;
          const accessToken = session.access_token;

          if (!accessToken) {
            console.warn("⚠️ No access_token available in session; skipping OAuth token storage");
          } else if (providerToken) {
            console.log("📥 Found provider_token, storing it...");
            
            const { error } = await supabase.functions.invoke("store-oauth-token", {
              body: {
                provider_token: providerToken,
                provider_refresh_token: providerRefreshToken,
                expires_at: session.expires_at,
              },
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });
            
            if (error) {
              console.error("❌ Failed to store OAuth token:", error);
            } else {
              console.log("✅ OAuth token stored successfully!");
            }
          } else {
            console.warn("⚠️ No provider_token in session");
          }
        } catch (error) {
          console.error("Error storing OAuth token:", error);
        }
        
        console.log("User signed in, redirecting to dashboard");
        navigate("/dashboard", { replace: true });
      }
      
      // Handle OAuth callback with tokens in URL hash
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        if (session) {
          console.log("Session established, redirecting to dashboard");
          navigate("/dashboard", { replace: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      // Use production URL if in production, otherwise use current origin
      const redirectUrl = import.meta.env.PROD 
        ? (import.meta.env.VITE_SITE_URL || window.location.origin)
        : window.location.origin;
      
      console.log("Starting Google OAuth with redirect:", `${redirectUrl}/auth`);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${redirectUrl}/auth`,
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
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 dark:bg-primary/10 rounded-full blur-[120px] animate-pulse" />

      {/* Header */}
      <div className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <BrandLogo size="md" />
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center p-4 min-h-[calc(100vh-88px)]">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Marketing */}
          <div className="space-y-8">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                <Sparkles className="w-4 h-4" />
                The Most Advanced SEO Platform
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                Start Dominating
                <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Search Rankings
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Transform your SEO with AI-powered insights, comprehensive keyword research, competitor analysis, and automated content generation.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3 pt-4">
              {[
                "Track 50M+ keywords across all search engines",
                "Analyze competitors and steal their strategies",
                "Monitor backlinks and domain authority in real-time",
                "Generate AI-optimized content for 8+ platforms",
                "Run technical audits with 60+ SEO checks",
                "Get instant alerts for algorithm updates"
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                7-day free trial
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Cancel anytime
              </div>
            </div>
          </div>

          {/* Right Side - Auth Card */}
          <div>
            <Card className="p-8 md:p-10 shadow-2xl border-border">
              <div className="space-y-6">
                <div className="space-y-3 text-center">
                  <h2 className="text-3xl font-bold text-foreground">Get Started Free</h2>
                  <p className="text-muted-foreground">
                    Sign in with Google to access your Search Console data and unlock all features
                  </p>
                </div>

                <Button
                  onClick={handleGoogleSignIn}
                  size="lg"
                  className="w-full h-14 text-base gradient-primary font-semibold"
                >
                  <svg className="mr-2 h-6 w-6" viewBox="0 0 24 24">
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

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">What you get</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span>Read-only access to your Search Console</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span>Your data is encrypted and never shared</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span>Start with 7-day free trial, no card required</span>
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground pt-4">
                  By continuing, you agree to our{" "}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
