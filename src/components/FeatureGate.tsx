import { ReactNode, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Zap, CreditCard, Sparkles } from 'lucide-react';
import { useCreditManager } from '@/hooks/useCreditManager';
import { getCreditCost, type FeatureKey } from '@/lib/credit-costs';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface FeatureGateProps {
  children: ReactNode;
  feature: FeatureKey;
  featureKey?: string; // For individual feature purchases
  showCost?: boolean;
  customCost?: number;
  onUnauthorized?: () => void;
}

/**
 * FeatureGate component
 * Wraps premium features and checks credit availability before rendering
 */
export function FeatureGate({
  children,
  feature,
  featureKey,
  showCost = true,
  customCost,
  onUnauthorized,
}: FeatureGateProps) {
  const { credits, hasFeatureAccess, hasUnlimitedCredits } = useCreditManager();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const navigate = useNavigate();

  const creditCost = customCost || getCreditCost(feature);

  useEffect(() => {
    async function checkAccess() {
      // Check if user has unlimited credits
      const unlimited = await hasUnlimitedCredits();
      setIsUnlimited(unlimited);

      if (unlimited) {
        setHasAccess(true);
        return;
      }

      // Check if feature is individually purchased
      if (featureKey) {
        const purchased = await hasFeatureAccess(featureKey);
        if (purchased) {
          setHasAccess(true);
          return;
        }
      }

      // Check if user has enough credits
      const hasCredits = (credits?.available || 0) >= creditCost;
      setHasAccess(hasCredits);

      if (!hasCredits && onUnauthorized) {
        onUnauthorized();
      }
    }

    checkAccess();
  }, [credits, creditCost, featureKey, hasFeatureAccess, hasUnlimitedCredits, onUnauthorized]);

  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <>
        <Card className="p-8 text-center border-2 border-dashed">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Premium Feature</h3>
              <p className="text-muted-foreground mb-4">
                This feature requires{' '}
                <Badge variant="secondary" className="font-bold">
                  <Zap className="h-3 w-3 mr-1" />
                  {creditCost} credits
                </Badge>
              </p>
              <p className="text-sm text-muted-foreground">
                Available: <span className="font-semibold">{credits?.available || 0} credits</span>
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => navigate('/settings?tab=subscription')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Buy Credits
              </Button>
              <Button variant="outline" onClick={() => setShowUpgradeModal(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            </div>
          </div>
        </Card>

        <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upgrade Your Plan</DialogTitle>
              <DialogDescription>
                Get unlimited access to this feature and more by upgrading to a premium plan.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <Card className="p-4 border-2 border-primary">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">Pro Plan</h4>
                    <p className="text-sm text-muted-foreground">3,000 credits/month</p>
                  </div>
                  <Badge>$99/mo</Badge>
                </div>
                <Button className="w-full mt-2" onClick={() => navigate('/pricing')}>
                  Choose Pro
                </Button>
              </Card>

              <Card className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">Agency Plan</h4>
                    <p className="text-sm text-muted-foreground">Unlimited credits</p>
                  </div>
                  <Badge variant="secondary">$299/mo</Badge>
                </div>
                <Button className="w-full mt-2" variant="outline" onClick={() => navigate('/pricing')}>
                  Choose Agency
                </Button>
              </Card>

              {featureKey && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    Or unlock just this feature:
                  </p>
                  <Button 
                    className="w-full" 
                    variant="secondary"
                    onClick={() => navigate('/settings?tab=subscription&section=features')}
                  >
                    Unlock This Feature Only
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      {showCost && !isUnlimited && (
        <div className="mb-4 flex items-center justify-between bg-card border rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-primary" />
            <span>
              This action will cost{' '}
              <span className="font-semibold text-foreground">{creditCost} credits</span>
            </span>
          </div>
          <Badge variant="outline">
            {credits?.available || 0} available
          </Badge>
        </div>
      )}
      {isUnlimited && showCost && (
        <div className="mb-4 flex items-center gap-2 bg-gradient-to-r from-primary/10 to-secondary/10 border rounded-lg p-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Unlimited - No credits required</span>
        </div>
      )}
      {children}
    </>
  );
}

/**
 * Simplified component to just show credit cost
 */
export function CreditCost({ feature, amount }: { feature: FeatureKey; amount?: number }) {
  const cost = amount || getCreditCost(feature);
  
  return (
    <Badge variant="secondary" className="font-normal">
      <Zap className="h-3 w-3 mr-1" />
      {cost} {cost === 1 ? 'credit' : 'credits'}
    </Badge>
  );
}

