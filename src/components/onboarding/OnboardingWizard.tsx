import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WelcomeStep } from "./WelcomeStep";
import { ConnectGSCStep } from "./ConnectGSCStep";
import { AddPropertyStep } from "./AddPropertyStep";
import { FirstAnalysisStep } from "./FirstAnalysisStep";
import { InviteTeamStep } from "./InviteTeamStep";
import { ChevronRight, ChevronLeft, X } from "lucide-react";

export interface OnboardingState {
  currentStep: number;
  selectedGoals: string[];
  connectedGSC: boolean;
  selectedProperty: string | null;
  completedAnalysis: boolean;
  skippedTeam: boolean;
  // New profile data
  profileData?: {
    name: string;
    notificationEmail: string;
    phone: string;
    googleEmail: string;
  };
  professionalData?: {
    position: string;
    country: string;
    companySize: string;
    monthlyTraffic: string;
  };
  companyData?: {
    companyName: string;
    website: string;
    linkedin: string;
    twitter: string;
  };
  industryData?: {
    businessType: string;
    responses: Record<string, any>;
  };
  subscriptionData?: {
    selectedPlan: string;
    trialActivated: boolean;
  };
}

const TOTAL_STEPS = 7;

export function OnboardingWizard() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    currentStep: 1,
    selectedGoals: [],
    connectedGSC: false,
    selectedProperty: null,
    completedAnalysis: false,
    skippedTeam: false,
  });

  // Define saveProgress first before using it in useEffect
  const saveProgress = useCallback(async (stepOverride?: number, completedOverride?: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        onboarding_step: stepOverride ?? currentStep,
        onboarding_completed: completedOverride ?? ((stepOverride ?? currentStep) === TOTAL_STEPS),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
    }
  }, [currentStep]);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('onboarding_completed, onboarding_step')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to check onboarding status:', error);
        return;
      }

      if (!profile) {
        // Create a new profile if it doesn't exist using upsert to avoid conflicts
        const { error: insertError } = await supabase.from('user_profiles').upsert({
          user_id: user.id,
          onboarding_step: 1,
          onboarding_completed: false,
        }, {
          onConflict: 'user_id'
        });
        
        if (insertError) {
          console.error('Error creating user profile:', insertError);
          return;
        }
        
        setCurrentStep(1);
        setIsOpen(true);
      } else if (!profile.onboarding_completed) {
        setCurrentStep(profile.onboarding_step);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    }
  };

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  // Resume wizard from URL after OAuth redirect
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const stepParam = params.get('onboardingStep');
      const gscParam = params.get('gsc');
      
      // If we have onboarding params and hash fragments (OAuth callback)
      if ((stepParam || gscParam) && hash.includes('access_token')) {
        console.log('OAuth callback detected, waiting for auth to complete...');
        setIsProcessingAuth(true);
        
        // Wait a bit for Supabase to process the hash and set up the session
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify session is ready
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('OAuth callback but no session established');
          setIsProcessingAuth(false);
          return;
        }
        
        console.log('Auth session ready, resuming wizard...');
        setIsProcessingAuth(false);
      }
      
      // Resume wizard if we have the params
      if (stepParam || gscParam) {
        const parsed = parseInt(stepParam || '1', 10);
        const stepNum = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), TOTAL_STEPS) : 1;
        setCurrentStep(stepNum);
        setOnboardingState(prev => ({
          ...prev,
          currentStep: stepNum,
          connectedGSC: gscParam === '1' ? true : prev.connectedGSC,
        }));
        setIsOpen(true);
        
        // Persist step immediately
        await saveProgress(stepNum, stepNum === TOTAL_STEPS);
        
        // Clean up URL - remove both query params and hash
        const url = new URL(window.location.href);
        url.searchParams.delete('onboardingStep');
        url.searchParams.delete('gsc');
        url.hash = ''; // Clear hash fragments
        window.history.replaceState({}, '', url.toString());
      }
    };
    
    handleOAuthCallback();
  }, [saveProgress]);

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setOnboardingState(prev => ({ ...prev, currentStep: nextStep }));
      await saveProgress(nextStep);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setOnboardingState(prev => ({ ...prev, currentStep: prevStep }));
    }
  };

  const handleSkip = async () => {
    // Allow skipping optional steps
    if (currentStep === TOTAL_STEPS) {
      // Team invitation is optional
      setOnboardingState(prev => ({ ...prev, skippedTeam: true }));
      await completeOnboarding();
    } else {
      await handleNext();
    }
  };

  const completeOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: upsertError } = await supabase.from('user_profiles').upsert({
        user_id: user.id,
        onboarding_completed: true,
        onboarding_step: TOTAL_STEPS,
        updated_at: new Date().toISOString(),
      });

      if (upsertError) {
        console.error('Failed to save onboarding completion:', upsertError);
        // Still close the wizard even if save fails
      }

      toast.success("Welcome aboard! 🎉", {
        description: "You're all set to start optimizing your SEO!",
      });

      setIsOpen(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast.error("Failed to save onboarding progress");
      // Still close the wizard
      setIsOpen(false);
      navigate('/dashboard');
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <WelcomeStep
            state={onboardingState}
            onUpdate={(update) => setOnboardingState(prev => ({ ...prev, ...update }))}
          />
        );
      case 2:
        return (
          <ConnectGSCStep
            state={onboardingState}
            onUpdate={(update) => setOnboardingState(prev => ({ ...prev, ...update }))}
          />
        );
      case 3:
        return (
          <AddPropertyStep
            state={onboardingState}
            onUpdate={(update) => setOnboardingState(prev => ({ ...prev, ...update }))}
          />
        );
      case 4:
        return (
          <FirstAnalysisStep
            state={onboardingState}
            onUpdate={(update) => setOnboardingState(prev => ({ ...prev, ...update }))}
          />
        );
      case 5:
        return (
          <InviteTeamStep
            state={onboardingState}
            onUpdate={(update) => setOnboardingState(prev => ({ ...prev, ...update }))}
          />
        );
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return onboardingState.selectedGoals.length > 0;
      case 2:
        return true; // Can skip GSC connection
      case 3:
        return true; // Can skip property selection
      case 4:
        return true; // Can skip analysis
      case 5:
        return true; // Team invitation is optional
      default:
        return true;
    }
  };

  // Show loading screen during OAuth processing
  if (isProcessingAuth) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Connecting Google Search Console...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait while we complete authentication</p>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 overflow-hidden m-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <DialogTitle className="text-2xl font-bold">Welcome to AnotherSEOGuru</DialogTitle>
              <p className="text-muted-foreground text-sm mt-1">
                Step {currentStep} of {TOTAL_STEPS}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="p-6 min-h-[400px]">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/30 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < TOTAL_STEPS && (
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gradient-primary"
            >
              {currentStep === TOTAL_STEPS ? "Get Started" : "Next"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
