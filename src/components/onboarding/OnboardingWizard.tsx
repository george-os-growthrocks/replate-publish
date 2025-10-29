import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
}

const TOTAL_STEPS = 5;

export function OnboardingWizard() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    currentStep: 1,
    selectedGoals: [],
    connectedGSC: false,
    selectedProperty: null,
    completedAnalysis: false,
    skippedTeam: false,
  });

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed, onboarding_step')
        .eq('user_id', user.id)
        .maybeSingle();

      // Show onboarding if not completed
      if (!profile || !profile.onboarding_completed) {
        setCurrentStep(profile?.onboarding_step || 1);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    }
  };

  const saveProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        onboarding_step: currentStep,
        onboarding_completed: currentStep === TOTAL_STEPS,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
    }
  };

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setOnboardingState(prev => ({ ...prev, currentStep: nextStep }));
      await saveProgress();
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

      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        onboarding_completed: true,
        onboarding_step: TOTAL_STEPS,
        updated_at: new Date().toISOString(),
      });

      toast.success("Welcome aboard! 🎉", {
        description: "You're all set to start optimizing your SEO!",
      });

      setIsOpen(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast.error("Failed to save onboarding progress");
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 overflow-hidden m-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Welcome to AnotherSEOGuru</h2>
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
