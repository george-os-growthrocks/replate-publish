import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem("cookieConsent");
    if (!cookieConsent) {
      // Show banner after 2 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setIsVisible(false);
  };

  const rejectCookies = () => {
    localStorage.setItem("cookieConsent", "rejected");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-500">
      <div className="rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">🍪 Cookie Settings</h3>
          </div>
          <button
            onClick={rejectCookies}
            className="p-1 hover:bg-accent rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <p className="text-sm text-muted-foreground mb-4">
          We use cookies to enhance your experience, analyze site usage, and personalize content. 
          By clicking "Accept All", you consent to our use of cookies.
        </p>

        {/* Links */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <Link to="/cookies" className="hover:text-primary hover:underline">
            Cookie Policy
          </Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-primary hover:underline">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link to="/gdpr" className="hover:text-primary hover:underline">
            GDPR
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={acceptCookies}
            size="sm"
            className="gradient-primary flex-1"
          >
            Accept All
          </Button>
          <Button
            onClick={rejectCookies}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}

