import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Loader2, 
  ChevronRight, 
  Globe, 
  Link as LinkIcon,
  Sparkles 
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";

interface GSCProperty {
  siteUrl: string;
  permissionLevel: string;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Step 2: GSC Connection
  const [gscConnected, setGscConnected] = useState(false);
  const [gscProperties, setGscProperties] = useState<GSCProperty[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  // Step 3: Create Project + Select Property
  const [projectName, setProjectName] = useState("");
  const [projectDomain, setProjectDomain] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Check if user just returned from Google OAuth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('gsc_connected') === 'true') {
      toast.success('Google connected! Loading your properties...');
      setGscConnected(true);
      setCurrentStep(3); // Move to step 3
      // Automatically fetch properties
      handleFetchProperties();
      // Clean up URL
      window.history.replaceState({}, '', '/onboarding');
    }
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth", { replace: true });
      return;
    }

    setUser(session.user);

    // Check if user has already completed onboarding
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profile?.onboarding_completed) {
      navigate("/dashboard", { replace: true });
      return;
    }

    // Check if user has connected GSC (OAuth tokens)
    const { data: tokens } = await supabase
      .from("user_oauth_tokens")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("provider", "google")
      .maybeSingle();

    if (tokens) {
      // User has GSC connected, go to step 3
      setGscConnected(true);
      setCurrentStep(3);
      // Fetch properties
      await handleFetchProperties();
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName || !projectDomain) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      // Create project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: projectName,
          domain: projectDomain,
          plan: "free",
        })
        .select()
        .single();

      if (projectError) throw projectError;

      setProjectId(project.id);
      toast.success("Project created successfully!");
      setCurrentStep(2);
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error(error.message || "Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishOnboarding = async () => {
    if (!projectId) {
      toast.error("Project not found. Please go back and create a project.");
      return;
    }

    setIsLoading(true);

    try {
      // Update project with GSC property if selected
      if (selectedProperty) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const selectedProp = gscProperties.find(p => p.siteUrl === selectedProperty);
          
          // Update project with GSC info
          const { error: updateError } = await supabase
            .from("projects")
            .update({
              gsc_connected: true,
              gsc_site_url: selectedProperty,
            })
            .eq("id", projectId);

          if (updateError) throw updateError;

          // Save GSC property connection
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gsc-save-property`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                project_id: projectId,
                site_url: selectedProperty,
                permission_level: selectedProp?.permissionLevel || "full",
              }),
            }
          );
        }
      }

      // Mark onboarding as completed (this also activates 7-day trial)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      toast.success("Setup complete! Your 7-day free trial has started. Welcome!");
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast.error(error.message || "Failed to complete setup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGSC = async () => {
    if (!user) return;

    setIsConnecting(true);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Session expired. Please sign in again.");
        navigate("/auth");
        return;
      }

      // Make a fetch request with user_id
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gsc-oauth-start?user_id=${encodeURIComponent(user.id)}`;

      console.log('Making request to:', functionUrl);

      try {
        const response = await fetch(functionUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const data = await response.json();
          console.log('Response data:', data);

          if (data.redirect_url) {
            console.log('Redirecting to Google OAuth...');
            toast.success('Redirecting to Google...');
            window.location.href = data.redirect_url;
            return;
          } else {
            toast.success('OAuth URL generated! Check console.');
          }
          return;
        } else {
          const errorData = await response.text();
          console.error('Error response:', errorData);
          toast.error(`Function error: ${response.status}`);
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        toast.error('Network error - check console');
      }
    } catch (error: any) {
      console.error("Error connecting GSC:", error);
      toast.error(error.message || "Failed to connect Google Search Console");
      setIsConnecting(false);
    }
  };

  const handleFetchProperties = async () => {
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Session expired. Please sign in again.");
        navigate("/auth");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gsc-sites`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.sites && data.sites.length > 0) {
        setGscProperties(data.sites);
        setGscConnected(true);
        toast.success(`Found ${data.sites.length} properties`);
      } else {
        toast.error("No GSC properties found");
      }
    } catch (error: any) {
      console.error("Error fetching properties:", error);
      toast.error(error.message || "Failed to fetch GSC properties");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProperty = async () => {
    if (!selectedProperty) {
      toast.error("Please select a property");
      return;
    }

    setCurrentStep(3);
  };


  const progress = (currentStep / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <BrandLogo size="lg" className="mb-6" />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Let's get you set up</h1>
              <p className="text-muted-foreground">
                Complete these steps to start analyzing your SEO performance
              </p>
            </div>
            <Progress value={progress} className="mt-4" />
          </div>

          {/* Step 1: Create Project */}
          {currentStep === 1 && (
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Create your first project</h2>
                    <p className="text-sm text-muted-foreground">
                      Add the website you want to track
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      placeholder="My Awesome Website"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectDomain">Domain</Label>
                    <Input
                      id="projectDomain"
                      type="url"
                      placeholder="https://example.com"
                      value={projectDomain}
                      onChange={(e) => setProjectDomain(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your website URL (e.g., https://example.com)
                    </p>
                  </div>

                  <Button 
                    onClick={() => setCurrentStep(2)}
                    className="w-full" 
                    size="lg"
                    disabled={!projectName || !projectDomain || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Please wait...
                      </>
                    ) : (
                      <>
                        Continue
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 2: Connect GSC */}
          {currentStep === 2 && (
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-3">
                    <LinkIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Connect Google Search Console</h2>
                    <p className="text-sm text-muted-foreground">
                      Get data from your GSC account
                    </p>
                  </div>
                </div>

                {!gscConnected ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <p className="text-sm">
                        We'll securely connect to your Google Search Console to fetch your SEO data.
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Read-only access to your GSC data</li>
                        <li>We never modify your data</li>
                        <li>You can disconnect anytime</li>
                      </ul>
                    </div>

                    <Button 
                      onClick={handleConnectGSC}
                      className="w-full" 
                      size="lg"
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          Connect Google Search Console
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => setCurrentStep(3)}
                      className="w-full"
                      disabled={isConnecting}
                    >
                      Skip for now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">GSC Connected Successfully!</span>
                    </div>

                    {gscProperties.length === 0 ? (
                      <Button 
                        onClick={handleFetchProperties}
                        className="w-full" 
                        size="lg"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading properties...
                          </>
                        ) : (
                          "Load My Properties"
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <Label>Select a property for this project:</Label>
                        <div className="space-y-2">
                          {gscProperties.map((property) => (
                            <button
                              key={property.siteUrl}
                              onClick={() => setSelectedProperty(property.siteUrl)}
                              className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                                selectedProperty === property.siteUrl
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <div className="font-medium">{property.siteUrl}</div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {property.permissionLevel} access
                              </div>
                            </button>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <Button 
                            onClick={handleSelectProperty}
                            className="w-full" 
                            size="lg"
                            disabled={!selectedProperty || isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                Continue with Selected Property
                                <ChevronRight className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setCurrentStep(3)}
                            className="w-full"
                            disabled={isLoading}
                          >
                            Skip property selection (connect later in Settings)
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Step 3: Complete */}
          {currentStep === 3 && (
            <Card className="p-6">
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Sparkles className="w-12 h-12 text-primary" />
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
                  <p className="text-muted-foreground">
                    Your project is ready. Let's start analyzing your SEO performance.
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-6 space-y-3 text-left">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Project created</span>
                  </div>
                  {gscConnected && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Google Search Console connected</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Free plan activated</span>
                  </div>
                </div>

                <Button 
                  onClick={handleFinishOnboarding}
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Go to Dashboard"
                  )}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

