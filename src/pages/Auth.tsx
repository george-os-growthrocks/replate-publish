import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Sparkles, Check, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";
import { trackSignup } from "@/lib/utils";

const Auth = () => {
  const navigate = useNavigate();
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const hasRedirected = useRef(false);
  const tokenData = useRef<{
    providerToken: string | null;
    refreshToken: string | null;
    expiresAt: string | null;
  }>({
    providerToken: null,
    refreshToken: null,
    expiresAt: null,
  });

  useEffect(() => {
    // Reset redirect flag when component mounts
    hasRedirected.current = false;
    tokenData.current = {
      providerToken: null,
      refreshToken: null,
      expiresAt: null,
    };
    
    // Check if we have OAuth tokens in the hash (extract immediately before Supabase processes)
    const hash = window.location.hash;
    const isOAuthCallback = hash.includes('access_token') && hash.includes('provider_token');
    
    if (isOAuthCallback) {
      setIsProcessingAuth(true);
      console.log('🔗 OAuth callback detected - extracting tokens...');
      
      // Extract tokens immediately from hash before Supabase processes it
      const params = new URLSearchParams(hash.substring(1));
      tokenData.current = {
        providerToken: params.get('provider_token'),
        refreshToken: params.get('provider_refresh_token'),
        expiresAt: params.get('expires_at'),
      };
      
      console.log('🔑 Tokens extracted:', {
        hasProviderToken: !!tokenData.current.providerToken,
        hasRefreshToken: !!tokenData.current.refreshToken
      });
      
      // Don't clean URL yet - let Supabase SDK process the hash first
      // It will automatically trigger onAuthStateChange
    }
    
    // Check for existing session first (only if not OAuth callback)
    if (!isOAuthCallback) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && !hasRedirected.current) {
          console.log("✅ Existing session found, redirecting to dashboard");
          hasRedirected.current = true;
          navigate("/dashboard", { replace: true });
        }
      });
    } else {
      // For OAuth callback, wait a bit then check if session was established
      // This is a fallback in case onAuthStateChange doesn't fire
      setTimeout(async () => {
        if (!hasRedirected.current) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            console.log("✅ Fallback: Session found after OAuth callback");
            
            // Save tokens
            if (tokenData.current.providerToken && session.user) {
              try {
                await supabase.from('user_oauth_tokens').upsert({
                  user_id: session.user.id,
                  provider: 'google',
                  access_token: tokenData.current.providerToken,
                  refresh_token: tokenData.current.refreshToken || null,
                  expires_at: tokenData.current.expiresAt 
                    ? new Date(parseInt(tokenData.current.expiresAt) * 1000).toISOString() 
                    : new Date(Date.now() + 3600 * 1000).toISOString(),
                  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
                  updated_at: new Date().toISOString(),
                }, {
                  onConflict: 'user_id,provider',
                  ignoreDuplicates: false
                });
                console.log('✅ OAuth tokens saved (fallback)');
              } catch (err) {
                console.error('Error saving token (fallback):', err);
              }
            }
            
            trackSignup();
            setIsProcessingAuth(false);
            hasRedirected.current = true;
            window.history.replaceState({}, '', window.location.pathname);
            navigate("/dashboard", { replace: true });
          }
        }
      }, 2000);
    }

    // Listen for auth state changes
    // Supabase automatically processes tokens from hash and triggers events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("📡 Auth state changed:", event, session ? `User: ${session.user?.id}` : "No session");
      
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") && session?.user) {
        if (!hasRedirected.current) {
          console.log("✅ User authenticated:", session.user.id);
          
          // Save OAuth tokens if we extracted them
          if (tokenData.current.providerToken && session.user) {
            try {
              console.log('💾 Saving OAuth tokens to database...');
              const { error } = await supabase.from('user_oauth_tokens').upsert({
                user_id: session.user.id,
                provider: 'google',
                access_token: tokenData.current.providerToken,
                refresh_token: tokenData.current.refreshToken || null,
                expires_at: tokenData.current.expiresAt 
                  ? new Date(parseInt(tokenData.current.expiresAt) * 1000).toISOString() 
                  : new Date(Date.now() + 3600 * 1000).toISOString(),
                scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id,provider',
                ignoreDuplicates: false
              });
              
              if (error) {
                console.error('❌ Failed to save token:', error);
              } else {
                console.log('✅ OAuth token saved successfully!');
              }
            } catch (err) {
              console.error('❌ Error saving OAuth token:', err);
            }
          }
          
          // Track signup
          if (event === "SIGNED_IN") {
            trackSignup();
          }
          
          hasRedirected.current = true;
          
          // Clean up URL hash after processing
          if (window.location.hash) {
            window.history.replaceState({}, '', window.location.pathname);
          }
          
          setIsProcessingAuth(false);
          console.log('🚀 Redirecting to dashboard...');
          
          // Small delay to ensure everything is saved
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 300);
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
        {/* Loading overlay for OAuth processing */}
        {isProcessingAuth && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="p-8 max-w-md">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <h3 className="text-lg font-semibold">Completing sign-in...</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Please wait while we set up your account and redirect you to the dashboard.
                </p>
              </div>
            </Card>
          </div>
        )}
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
