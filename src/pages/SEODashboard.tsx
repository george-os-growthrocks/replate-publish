import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Zap, Plus } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { SERPTracker } from "@/components/seo/SERPTracker";
import { SERPMonitoring } from "@/components/seo/SERPMonitoring";
import { CompetitorAnalysis } from "@/components/seo/CompetitorAnalysis";
import { ContentGapAnalysis } from "@/components/seo/ContentGapAnalysis";
import { ContentScoring } from "@/components/seo/ContentScoring";
import { KeywordMatrix } from "@/components/seo/KeywordMatrix";
import { RankingPredictor } from "@/components/seo/RankingPredictor";
import { VoiceSearchOptimizer } from "@/components/seo/VoiceSearchOptimizer";
import { BacklinkMonitor } from "@/components/seo/BacklinkMonitor";
import { ContentCalendarView } from "@/components/seo/ContentCalendarView";
import { TechnicalAudit } from "@/components/seo/TechnicalAudit";
import { ProjectSelector } from "@/components/seo/ProjectSelector";
import { SiteAuditCrawler } from "@/components/seo/SiteAuditCrawler";
import { GoogleIntegrations } from "@/components/seo/GoogleIntegrations";
import { SEOProjectOnboarding } from "@/components/seo/SEOProjectOnboarding";
import { ProjectOverview } from "@/components/seo/ProjectOverview";
import { SEOSidebar } from "@/components/seo/SEOSidebar";
import { BulkAnalysis } from "@/components/seo/BulkAnalysis";
import { KeywordClustering } from "@/components/seo/KeywordClustering";
import { MultiLocationTracker } from "@/components/seo/MultiLocationTracker";
import { RevenueAttribution } from "@/components/seo/RevenueAttribution";
import { ComprehensiveAudit } from "@/components/seo/ComprehensiveAudit";
import { KeywordOpportunityAnalyzer } from "@/components/seo/KeywordOpportunityAnalyzer";
import { SiteAuditDashboard } from "@/components/seo/SiteAuditDashboard";
import { AIRecommendations } from "@/components/seo/AIRecommendations";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryWheel } from "@/components/enterprise/QueryWheel";
import { IntentMatcher } from "@/components/enterprise/IntentMatcher";
import { AIOOptimizer } from "@/components/enterprise/AIOOptimizer";
import { SeoReport } from "@/components/seo/SeoReport";
import { PublicResearchRealTime } from "@/components/PublicResearchRealTime";
import { AdvancedAnalytics } from "@/components/analytics/AdvancedAnalytics";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AIContentStrategyGenerator } from "@/components/ai/AIContentStrategyGenerator";
import { PredictiveSEOAnalytics } from "@/components/ai/PredictiveSEOAnalytics";
import { AISERPOptimizer } from "@/components/ai/AISERPOptimizer";
import { AdvancedPerformanceDashboard } from "@/components/ai/AdvancedPerformanceDashboard";
import { TeamCollaborationSuite } from "@/components/ai/TeamCollaborationSuite";
import { InternalLinkingAnalyzer } from "@/components/seo/InternalLinkingAnalyzer";
import { AdvancedSEOAnalytics } from "@/components/seo/AdvancedSEOAnalytics";
import { DataForSEOTest } from "@/components/seo/DataForSEOTest";
import KeywordResearchMatrix from "@/components/seo/KeywordResearchMatrix";
import SERPTrackerMinimal from "@/components/seo/SERPTrackerMinimal";
import ProjectOverviewMinimal from "@/components/seo/ProjectOverviewMinimal";
import GoogleIntegrationsMinimal from "@/components/seo/GoogleIntegrationsMinimal";
import { QuickKeywordResearch } from "@/components/seo/QuickKeywordResearch";

export default function SEODashboard() {
  return (
    <ProtectedRoute>
      <Helmet>
        <title>SEO Dashboard - AnotherSEOGuru</title>
        <meta name="description" content="Manage your SEO projects and track rankings" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <SEODashboardContent />
    </ProtectedRoute>
  );
}

function SEODashboardContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    const { data, error } = await supabase
      .from('seo_projects')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading projects:', error);
      return;
    }

    setProjects(data || []);
    if (data && data.length > 0 && !selectedProject) {
      setSelectedProject(data[0].id);
    }
  };

  const handleOnboardingComplete = (projectId: string) => {
    setShowOnboarding(false);
    loadProjects();
    setSelectedProject(projectId);
    toast({
      title: "Setup Complete! 🎉",
      description: "Your SEO project is ready. Explore all the tools in the tabs above.",
    });
  };

  const handleNewProject = () => {
    setShowOnboarding(true);
    setSelectedProject(null);
  };

  const handleDeleteProject = async (projectId: string) => {
    const { error } = await supabase
      .from('seo_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Project Deleted",
      description: "The project has been removed successfully",
    });
    
    loadProjects();
    if (selectedProject === projectId) {
      setSelectedProject(null);
    }
  };

  const renderContent = () => {
    if (!selectedProject) {
      if (showOnboarding) {
        if (!user?.id) {
          return (
            <Card className="p-12 text-center">
              <h3 className="text-2xl font-bold mb-2">Authentication Required</h3>
              <p className="text-muted-foreground">Please sign in to create a project</p>
            </Card>
          );
        }
        return <SEOProjectOnboarding userId={user.id} onComplete={handleOnboardingComplete} />;
      }
      return (
        <Card className="p-12 text-center">
          <Zap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-2xl font-bold mb-2">No Projects Yet</h3>
          <p className="text-muted-foreground mb-6">Create your first SEO project with our guided setup</p>
          <Button onClick={() => setShowOnboarding(true)} size="lg" className="gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Project
          </Button>
        </Card>
      );
    }

    // ✅ Updated routing for consolidated sidebar
    switch (activeTab) {
      // Overview & Reporting
      case "overview":
        return <ProjectOverviewMinimal projectId={selectedProject} />;
      case "analytics": // Merged analytics hub
        return (
          <ErrorBoundary>
            <AdvancedAnalytics projectId={selectedProject} />
          </ErrorBoundary>
        );
      case "seo-report":
        return <SeoReport projectId={selectedProject} />;

      // AI Intelligence
      case "ai-recommendations":
        return <AIRecommendations projectId={selectedProject} userId={user?.id || ""} />;
      case "content-strategy":
        return <AIContentStrategyGenerator projectId={selectedProject} />;
      case "predictive-analytics": // Merged predictions
        return <PredictiveSEOAnalytics projectId={selectedProject} />;
      case "serp-optimizer": // Merged SERP intelligence
        return <AISERPOptimizer projectId={selectedProject} />;

      // Keywords & Rankings
      case "keyword-research": // Unified keyword view
        return <KeywordResearchMatrix projectId={selectedProject} />;
      case "serp": // Rank tracking
        return <SERPTrackerMinimal projectId={selectedProject} />;
      case "competitors":
        return <CompetitorAnalysis projectId={selectedProject} />;
      case "opportunities":
        return <KeywordOpportunityAnalyzer projectId={selectedProject} />;

      // Content & Technical
      case "calendar":
        return <ContentCalendarView projectId={selectedProject} />;
      case "content-gaps":
        return <ContentGapAnalysis projectId={selectedProject} />;
      case "content":
        return <ContentScoring projectId={selectedProject} />;
      case "audit":
        const projectForAudit = projects.find(p => p.id === selectedProject);
        return <SiteAuditDashboard projectId={selectedProject} domain={projectForAudit?.domain || ''} />;
      case "backlinks":
        return <BacklinkMonitor projectId={selectedProject} />;
      case "internal-linking":
        return <InternalLinkingAnalyzer projectId={selectedProject} />;

      // Integrations & Settings
      case "integrations":
        return <GoogleIntegrationsMinimal projectId={selectedProject} />;
      case "dataforseo-test": // API Settings
        return <DataForSEOTest projectId={selectedProject} />;
      case "multi-location":
        return <MultiLocationTracker projectId={selectedProject} />;
      case "revenue":
        return <RevenueAttribution projectId={selectedProject} />;

      // Legacy routes (for backward compatibility)
      case "monitoring":
        return <SERPMonitoring projectId={selectedProject} />;
      case "predictions":
        return <RankingPredictor projectId={selectedProject} />;
      case "voice-search":
        return <VoiceSearchOptimizer projectId={selectedProject} />;
      case "bulk":
        return <BulkAnalysis projectId={selectedProject} />;
      case "clustering":
        return <KeywordClustering projectId={selectedProject} />;
      case "comprehensive-audit":
        const project = projects.find(p => p.id === selectedProject);
        return <ComprehensiveAudit projectId={selectedProject} domain={project?.domain || ''} />;
      case "technical":
        return <TechnicalAudit projectId={selectedProject} />;
      case "query-wheel":
        return <QueryWheel />;
      case "intent-matcher":
        return <IntentMatcher />;
      case "aio-optimizer":
        return <AIOOptimizer />;
      case "public-research":
        return <PublicResearchRealTime />;
      case "performance-dashboard":
        return <AdvancedPerformanceDashboard projectId={selectedProject} />;
      case "team-collaboration":
        return <TeamCollaborationSuite projectId={selectedProject} />;
      case "advanced-analytics":
        return <AdvancedSEOAnalytics projectId={selectedProject} />;
      case "keywords":
      case "keyword-matrix":
        return (
          <div className="space-y-6">
            <QuickKeywordResearch projectId={selectedProject} onKeywordsFound={(count) => {
              toast({
                title: "Keywords Added!",
                description: `${count} keywords have been added to your analysis`,
              });
            }} />
            <KeywordResearchMatrix projectId={selectedProject} />
          </div>
        );
      default:
        return <ProjectOverview projectId={selectedProject} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative bg-gradient-to-br from-background via-background to-muted/20">
        {selectedProject && <SEOSidebar onTabChange={setActiveTab} activeTab={activeTab} />}

        <div className="flex-1 flex flex-col">
          {/* Enhanced SEO Suite Header */}
          <div className="sticky top-16 z-[10000] flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 md:px-8 shadow-sm">
            {selectedProject && <SidebarTrigger className="mr-2 flex-shrink-0 hover:bg-accent rounded-lg transition-colors" />}
            <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground tracking-tight">
                    SEO Suite
                  </h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Professional SEO Intelligence Platform
                  </p>
                </div>
              </div>
              {selectedProject && (
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/20">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                    <span className="text-sm font-semibold text-success">Active</span>
                  </div>
                  <Button
                    onClick={handleNewProject}
                    size="sm"
                    className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline font-semibold">New Project</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Main Content */}
          <main className="flex-1 overflow-auto bg-gradient-to-b from-background to-muted/10">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="max-w-[1600px] mx-auto space-y-8">
                <Breadcrumb />
                {selectedProject && (
                  <div className="mb-8">
                    <ProjectSelector
                      projects={projects}
                      selectedProject={selectedProject}
                      onSelectProject={setSelectedProject}
                      onDeleteProject={handleDeleteProject}
                    />
                  </div>
                )}
                <div className="relative animate-in fade-in duration-500">
                  {renderContent()}
                </div>
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}