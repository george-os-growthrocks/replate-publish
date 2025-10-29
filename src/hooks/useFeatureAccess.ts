/**
 * Hook to check feature access based on user's subscription plan
 */
import { useSubscription } from "./useSubscription";
import { 
  hasFeatureAccess, 
  getFeatureByKey, 
  getPlanName,
  isSubscriptionActive,
  getFeaturesForPlan,
  type PlanName,
  type FeatureDefinition,
} from "@/lib/feature-access";

export function useFeatureAccess() {
  const { data: subscription } = useSubscription();
  
  const userPlan = subscription ? getPlanName(subscription.plan) : 'Free';
  const isActive = isSubscriptionActive(subscription?.status);
  
  /**
   * Check if user has access to a feature
   */
  const checkAccess = (featureKey: string): boolean => {
    if (!isActive) return false;
    
    const feature = getFeatureByKey(featureKey);
    if (!feature) return false;
    
    return hasFeatureAccess(userPlan, feature.requiredPlan);
  };
  
  /**
   * Get all features available to user
   */
  const getAvailableFeatures = (): FeatureDefinition[] => {
    if (!isActive) return [];
    return getFeaturesForPlan(userPlan);
  };
  
  /**
   * Check if user can access a plan level or higher
   */
  const hasPlanAccess = (requiredPlan: PlanName): boolean => {
    if (!isActive) return false;
    return hasFeatureAccess(userPlan, requiredPlan);
  };
  
  return {
    userPlan,
    isActive,
    checkAccess,
    getAvailableFeatures,
    hasPlanAccess,
    subscription,
  };
}

