import { ReactNode, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, Zap, CreditCard, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { useCreditManager } from '@/hooks/useCreditManager';
import { useSubscription } from '@/hooks/useSubscription';
import { getCreditCost, type FeatureKey } from '@/lib/credit-costs';
import { 
  hasFeatureAccess, 
  getFeatureByKey, 
  getPlanName,
  isSubscriptionActive,
  type PlanName,
} from '@/lib/feature-access';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface FeatureGateProps {
  children: ReactNode;
  feature: FeatureKey;
  featureKey?: string; // For individual feature purchases
  showCost?: boolean;
  customCost?: number;
  onUnauthorized?: () => void;
  requiredPlan?: PlanName; // Optional override for plan requirement
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
  requiredPlan,
}: FeatureGateProps) {
  const { credits, hasFeatureAccess: hasIndividualFeature, hasUnlimitedCredits } = useCreditManager();
  const { data: subscription } = useSubscription();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const navigate = useNavigate();

  const creditCost = customCost || getCreditCost(feature);
  
  // Get feature definition to check plan requirements
  const featureDef = getFeatureByKey(feature);
  const planRequirement = requiredPlan || featureDef?.requiredPlan || 'Starter';
  const userPlan = subscription ? getPlanName(subscription.plan) : 'Free';
  const isActive = isSubscriptionActive(subscription?.status);
  const isTrialing = subscription?.status === 'trialing';
  
  // Calculate trial days remaining
  const trialDaysRemaining = isTrialing && subscription?.trial_end
    ? Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  useEffect(() => {
    async function checkAccess() {
      // Check subscription status first
      if (!isActive) {
        setHasAccess(false);
        return;
      }

      // If user is on trial, grant access to all features (with notification shown in UI)
      // Otherwise, check plan access normally
      if (!isTrialing && !hasFeatureAccess(userPlan, planRequirement)) {
        setHasAccess(false);
        return;
      }

      // Check if user has unlimited credits
      const unlimited = await hasUnlimitedCredits();
      setIsUnlimited(unlimited);

      if (unlimited) {
        setHasAccess(true);
        return;
      }

      // Check if feature is individually purchased
      if (featureKey) {
        const purchased = await hasIndividualFeature(featureKey);
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
  }, [credits, creditCost, featureKey, hasIndividualFeature, hasUnlimitedCredits, onUnauthorized, userPlan, planRequirement, isActive, isTrialing]);

  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    const needsPlanUpgrade = !hasFeatureAccess(userPlan, planRequirement);
    const needsCredits = isActive && hasFeatureAccess(userPlan, planRequirement) && (credits?.available || 0) < creditCost;

    return (
      <>
        <Card className="p-8 text-center border-2 border-dashed">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {needsPlanUpgrade ? `${planRequirement}+ Plan Required` : 'Insufficient Credits'}
              </h3>
              {needsPlanUpgrade ? (
                <p className="text-muted-foreground mb-4">
                  This feature requires <Badge variant="secondary" className="font-bold">{planRequirement}</Badge> plan or higher.
                  {featureDef && (
                    <span className="block mt-2 text-sm">Current plan: <strong>{userPlan}</strong></span>
                  )}
                </p>
              ) : (
                <>
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
                </>
              )}
            </div>

            <div className="flex gap-2">
              {needsCredits && (
                <Button onClick={() => navigate('/settings?tab=subscription')}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Buy Credits
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowUpgradeModal(true)} className="gradient-primary">
                <Sparkles className="h-4 w-4 mr-2" />
                {needsPlanUpgrade ? 'Upgrade Plan' : 'View Plans'}
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
              {/* Show relevant upgrade options based on plan requirement */}
              {(planRequirement === 'Starter' || planRequirement === 'Pro' || planRequirement === 'Agency') && (
                <>
                  {planRequirement === 'Starter' && userPlan === 'Free' && (
                    <Card className="p-4 border-2 border-primary">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">Starter Plan</h4>
                          <p className="text-sm text-muted-foreground">500 credits/month • {featureDef?.name || 'This feature'}</p>
                        </div>
                        <Badge>$29/mo</Badge>
                      </div>
                      <Button className="w-full mt-2 gradient-primary" onClick={() => navigate('/pricing')}>
                        Choose Starter
                      </Button>
                    </Card>
                  )}
                  
                  {(planRequirement === 'Pro' || (planRequirement === 'Starter' && userPlan === 'Starter')) && (
                    <Card className={`p-4 ${planRequirement === 'Pro' ? 'border-2 border-primary' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">Pro Plan</h4>
                          <p className="text-sm text-muted-foreground">2,000 credits/month • All Starter + Pro features</p>
                        </div>
                        <Badge>$79/mo</Badge>
                      </div>
                      <Button className="w-full mt-2 gradient-primary" onClick={() => navigate('/pricing')}>
                        Choose Pro
                      </Button>
                    </Card>
                  )}
                  
                  {(planRequirement === 'Agency' || (planRequirement === 'Pro' && userPlan === 'Pro')) && (
                    <Card className={`p-4 ${planRequirement === 'Agency' ? 'border-2 border-primary' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">Agency Plan</h4>
                          <p className="text-sm text-muted-foreground">5,000 credits/month • White-label + API</p>
                        </div>
                        <Badge variant="secondary">$149/mo</Badge>
                      </div>
                      <Button className="w-full mt-2" variant="outline" onClick={() => navigate('/pricing')}>
                        Choose Agency
                      </Button>
                    </Card>
                  )}
                </>
              )}

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
      {/* Trial Notification Banner */}
      {isTrialing && (!hasFeatureAccess(userPlan, planRequirement)) && (
        <Alert className="mb-4 border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-700 dark:text-amber-300">
            Free Trial Access
          </AlertTitle>
          <AlertDescription className="text-amber-600 dark:text-amber-400">
            <div className="space-y-1">
              <p>
                You're accessing a <strong>{planRequirement}</strong> feature during your free trial.
                {trialDaysRemaining > 0 && (
                  <span className="ml-2">
                    <strong>{trialDaysRemaining}</strong> {trialDaysRemaining === 1 ? 'day' : 'days'} remaining.
                  </span>
                )}
              </p>
              <p className="text-xs opacity-90">
                {trialDaysRemaining <= 2 
                  ? 'Add a payment method to continue using this feature after your trial ends.'
                  : 'Upgrade to a paid plan before your trial ends to keep full access.'}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Trial Warning for Higher-Tier Features */}
      {isTrialing && hasFeatureAccess(userPlan, planRequirement) && planRequirement !== 'Starter' && (
        <Alert className="mb-4 border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-primary/10">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-700 dark:text-blue-300">
            Trial Period Active
          </AlertTitle>
          <AlertDescription className="text-blue-600 dark:text-blue-400">
            You're on a free trial. {trialDaysRemaining > 0 && (
              <>
                <strong>{trialDaysRemaining}</strong> {trialDaysRemaining === 1 ? 'day' : 'days'} remaining.
              </>
            )} 
            Upgrade to continue access after your trial ends.
          </AlertDescription>
        </Alert>
      )}

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

