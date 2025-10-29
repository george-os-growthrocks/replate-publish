import { OnboardingState } from "./OnboardingWizard";
import { User, Mail, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BasicProfileStepProps {
  state: OnboardingState;
  onUpdate: (update: Partial<OnboardingState>) => void;
}

export function BasicProfileStep({ state, onUpdate }: BasicProfileStepProps) {
  const [name, setName] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");

  useEffect(() => {
    // Get user's Google email
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setGoogleEmail(user.email || "");
        // Pre-fill name from Google metadata
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
        setName(fullName);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    // Update parent state when values change
    onUpdate({
      profileData: {
        name,
        notificationEmail,
        phone,
        googleEmail
      }
    });
  }, [name, notificationEmail, phone, googleEmail, onUpdate]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-foreground">Complete Your Profile</h3>
        <p className="text-muted-foreground">
          Let's personalize your experience
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="h-11"
              required
            />
          </div>

          {/* Google Email (display only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Google Account Email
            </Label>
            <Input
              value={googleEmail}
              disabled
              className="h-11 bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              This is your Google account email used for authentication
            </p>
          </div>

          {/* Notification Email (optional) */}
          <div className="space-y-2">
            <Label htmlFor="notificationEmail" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Notification Email (Optional)
            </Label>
            <Input
              id="notificationEmail"
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="notifications@company.com"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              If different from your Google email. We'll send alerts and reports here.
            </p>
          </div>

          {/* Phone (optional) */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number (Optional)
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              For important account notifications and support
            </p>
          </div>
        </div>
      </Card>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-foreground">
          <strong className="font-semibold">Privacy First:</strong> Your information is encrypted and never shared with third parties.
        </p>
      </div>
    </div>
  );
}
