import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";
import { trackSignup } from "@/lib/utils";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<string>("monthly");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard", { replace: true });
      }
    });

    // Get plan selection from localStorage
    const plan = localStorage.getItem('selected_plan');
    const billing = localStorage.getItem('selected_billing');
    if (plan) setSelectedPlan(plan);
    if (billing) setSelectedBilling(billing);
  }, [navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Sign up with Supabase Auth
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

      if (error) throw error;

      if (data.user) {
        // Track signup
        trackSignup();
        
        toast.success("Account created successfully! Redirecting to dashboard...");
        
        // Clear plan selection from localStorage (Stripe checkout skipped for now)
        localStorage.removeItem('selected_plan');
        localStorage.removeItem('selected_billing');
        
        // Always go to dashboard - free plan will be auto-created by trigger
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create account";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <ArrowLeft className="w-4 h-4" />
          <BrandLogo />
        </Link>
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Benefits */}
          <div className="hidden md:block space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-4">
                Start Your SEO Journey
                <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Free Trial Included
                </span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Join thousands of marketers growing their organic traffic
              </p>
            </div>

            {selectedPlan && (
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-sm font-semibold text-primary mb-2">Selected Plan</p>
                <p className="text-2xl font-bold">{selectedPlan}</p>
                <p className="text-sm text-muted-foreground capitalize">{selectedBilling} billing</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">7-Day Free Trial</p>
                  <p className="text-sm text-muted-foreground">No credit card required to start</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">All Features Included</p>
                  <p className="text-sm text-muted-foreground">Full access during trial period</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Cancel Anytime</p>
                  <p className="text-sm text-muted-foreground">No long-term commitments</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <Card className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Create Your Account</h2>
              <p className="text-muted-foreground">Start your free trial today</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
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
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={6}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-semibold">
                  Sign In
                </Link>
              </p>
            </div>

            <div className="mt-4 text-xs text-center text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;
