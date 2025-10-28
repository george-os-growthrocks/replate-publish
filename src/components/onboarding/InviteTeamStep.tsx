import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OnboardingState } from "./OnboardingWizard";
import { Users, Mail, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface InviteTeamStepProps {
  state: OnboardingState;
  onUpdate: (update: Partial<OnboardingState>) => void;
}

export function InviteTeamStep({ state, onUpdate }: InviteTeamStepProps) {
  const [email, setEmail] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);

  const handleInvite = () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (invitedEmails.includes(email)) {
      toast.error("This email has already been invited");
      return;
    }

    setInvitedEmails([...invitedEmails, email]);
    setEmail("");
    toast.success(`Invitation sent to ${email}`);
  };

  const handleRemove = (emailToRemove: string) => {
    setInvitedEmails(invitedEmails.filter(e => e !== emailToRemove));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 mx-auto mb-4 flex items-center justify-center">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Invite Your Team</h3>
        <p className="text-muted-foreground">
          Collaborate with team members (optional)
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Email Address
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                className="flex-1"
              />
              <Button onClick={handleInvite}>
                <Mail className="w-4 h-4 mr-2" />
                Invite
              </Button>
            </div>
          </div>

          {invitedEmails.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3">
                Invited Team Members ({invitedEmails.length})
              </p>
              <div className="space-y-2">
                {invitedEmails.map((invitedEmail) => (
                  <div
                    key={invitedEmail}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm">{invitedEmail}</span>
                      <Badge variant="secondary" className="text-xs">
                        Pending
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(invitedEmail)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 mx-auto mb-2 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <h4 className="font-semibold text-sm mb-1">Collaborate</h4>
          <p className="text-xs text-muted-foreground">
            Work together on SEO projects
          </p>
        </Card>

        <Card className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-green-500/10 mx-auto mb-2 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <h4 className="font-semibold text-sm mb-1">Assign Tasks</h4>
          <p className="text-xs text-muted-foreground">
            Delegate SEO activities
          </p>
        </Card>

        <Card className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 mx-auto mb-2 flex items-center justify-center">
            <Mail className="w-5 h-5 text-purple-500" />
          </div>
          <h4 className="font-semibold text-sm mb-1">Share Reports</h4>
          <p className="text-xs text-muted-foreground">
            Send insights to stakeholders
          </p>
        </Card>
      </div>

      <div className="p-4 bg-muted/50 border rounded-lg">
        <p className="text-xs text-muted-foreground">
          💡 You can skip this step and invite team members later from Settings → Team Management
        </p>
      </div>
    </div>
  );
}
