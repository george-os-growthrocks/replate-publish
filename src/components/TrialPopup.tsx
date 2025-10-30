import { useState, useEffect } from "react";
import { X, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

export function TrialPopup() {
  const { data: subscription } = useSubscription();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if user is actually on trial
    const isOnTrial = subscription?.status === 'trialing' && 
                      subscription?.trial_end && 
                      new Date(subscription.trial_end) > new Date();
    
    if (!isOnTrial) {
      return; // Don't show popup if not on trial
    }

    // Check if popup was already shown in this session
    const popupShown = sessionStorage.getItem("trialPopupShown");
    
    if (!popupShown) {
      // Show popup after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
        sessionStorage.setItem("trialPopupShown", "true");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [subscription]);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-300"
        onClick={() => setIsVisible(false)}
      />
      
      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4 animate-in zoom-in-95 duration-300">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl relative">
          {/* Close Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          {/* Content */}
          <h2 className="text-2xl font-bold text-center mb-3 text-foreground">
            Get <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">ALL Features</span> Free!
          </h2>
          <p className="text-center text-muted-foreground mb-6">
            Start your 7-day free trial now. Full access to all features. No credit card required.
          </p>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-sm text-muted-foreground">25+ powerful SEO tools</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-sm text-muted-foreground">AI content generation for 8+ platforms</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-sm text-muted-foreground">Unlimited keyword tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-sm text-muted-foreground">Cancel anytime, no questions asked</span>
            </div>
          </div>

          {/* CTA */}
          <Button asChild className="w-full gradient-primary text-lg py-6 mb-3">
            <Link to="/auth" onClick={() => setIsVisible(false)}>
              Start Free 7-Day Trial
            </Link>
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            No credit card required • Full access • Cancel anytime
          </p>
        </div>
      </div>
    </>
  );
}

