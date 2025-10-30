import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, TrendingUp, Sparkles, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    // Check if user is already authenticated
      supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log("✅ User already authenticated, redirecting to dashboard");
          navigate("/dashboard", { replace: true });
        }
      });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔐 Auth state change:", event);
      
      if (event === "SIGNED_IN" && session) {
        console.log("✅ User signed in, redirecting to dashboard");
            navigate("/dashboard", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        toast.error(error.message || "Failed to sign in");
        return;
      }

      if (data.user) {
        console.log("✅ Sign in successful");
        toast.success("Welcome back!");
        // Navigation handled by onAuthStateChange
      }
    } catch (error) {
      console.error("Unexpected sign in error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error("Sign up error:", error);
        
        // Handle "user already registered" specifically
        if (error.message?.toLowerCase().includes("already registered")) {
          toast.error("This email is already registered. Please sign in instead.");
          // Optionally switch to sign-in mode after a delay
          setTimeout(() => {
            setIsSignUp(false);
          }, 2000);
        } else {
          toast.error(error.message || "Failed to sign up");
        }
        return;
      }

      if (data.user) {
        console.log("✅ Sign up successful");
        
        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          toast.success("Please check your email to confirm your account");
        } else {
          toast.success("Account created! Redirecting to onboarding...");
          navigate("/onboarding", { replace: true });
        }
      }
    } catch (error) {
      console.error("Unexpected sign up error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-gray-900 dark:via-blue-950 dark:to-gray-800">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/80 via-cyan-100/60 to-blue-200/40 dark:from-blue-900/30 dark:via-cyan-900/40 dark:to-blue-800/30 animate-pulse" />

      {/* Floating gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 dark:from-blue-500/30 dark:to-cyan-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-cyan-400/15 to-blue-400/15 dark:from-cyan-500/25 dark:to-blue-500/25 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-400/10 to-emerald-400/10 dark:from-blue-500/20 dark:to-emerald-500/20 rounded-full blur-3xl animate-pulse delay-500" />

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
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Back to home
            </Link>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-gray-900 via-blue-800 to-cyan-800 dark:from-white dark:via-blue-200 dark:to-cyan-200 bg-clip-text text-transparent">
                Supercharge your SEO with AI-powered insights
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-200">
                Get actionable recommendations from your Google Search Console data
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 p-2 mt-1 border border-blue-200 dark:border-blue-800">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Deep Analytics</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Understand your search performance with detailed keyword and page analysis
                  </p>
            </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/50 dark:to-blue-900/50 p-2 mt-1 border border-cyan-200 dark:border-cyan-800">
                  <Sparkles className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">AI-Powered Insights</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Get smart recommendations powered by Google's Gemini AI
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/50 dark:to-teal-900/50 p-2 mt-1 border border-green-200 dark:border-green-800">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Track Progress</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Monitor your rankings and identify growth opportunities
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <Card className="p-8 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-0 shadow-2xl">
              <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isSignUp ? "Create your account" : "Welcome back"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {isSignUp
                    ? "Start improving your SEO today"
                    : "Sign in to continue to your dashboard"
                  }
                  </p>
                </div>

              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  {isSignUp && (
                    <p className="text-xs text-muted-foreground">
                      Must be at least 6 characters
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isSignUp ? "Creating account..." : "Signing in..."}
                    </>
                  ) : (
                    <>{isSignUp ? "Create account" : "Sign in"}</>
                  )}
                </Button>
              </form>

              <div className="text-center text-sm">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setEmail("");
                    setPassword("");
                    setFullName("");
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium"
                  disabled={isLoading}
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>

              {!isSignUp && (
                <div className="text-center text-sm">
                  <Link
                    to="/reset-password"
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
              </div>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
