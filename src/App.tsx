import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FilterProvider } from "@/contexts/FilterContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import FeaturesPage from "./pages/FeaturesPage";
import PricingFullPage from "./pages/PricingFullPage";
import SeoGlossaryPage from "./pages/SeoGlossaryPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import AiOverviewChecker from "./pages/free-tools/AiOverviewChecker";
import ChatGptPromptsLibrary from "./pages/free-tools/ChatGptPromptsLibrary";
import KeywordClusteringTool from "./pages/free-tools/KeywordClusteringTool";
import MetaTagsGenerator from "./pages/free-tools/MetaTagsGenerator";
import HeadingAnalyzer from "./pages/free-tools/HeadingAnalyzer";
import RobotsTxtGenerator from "./pages/free-tools/RobotsTxtGenerator";
import SchemaGenerator from "./pages/free-tools/SchemaGenerator";
import KeywordDensityChecker from "./pages/free-tools/KeywordDensityChecker";
import QueriesPage from "./pages/QueriesPage";
import PagesPage from "./pages/PagesPage";
import CountriesPage from "./pages/CountriesPage";
import DevicesPage from "./pages/DevicesPage";
import CannibalizationPage from "./pages/CannibalizationPage";
import LinkOpportunitiesPage from "./pages/LinkOpportunitiesPage";
import KeywordResearchPage from "./pages/KeywordResearchPage";
import CompetitorAnalysisPage from "./pages/CompetitorAnalysisPage";
import LocalSeoPage from "./pages/LocalSeoPage";
import ShoppingPage from "./pages/ShoppingPage";
import OnPageSeoPage from "./pages/OnPageSeoPage";
import BacklinksPage from "./pages/BacklinksPage";
import SerpAnalysisPage from "./pages/SerpAnalysisPage";
import SiteAuditPage from "./pages/SiteAuditPage";
import RepurposePage from "./pages/RepurposePage";
import KeywordClusteringPage from "./pages/KeywordClusteringPage";
import ContentGapPage from "./pages/ContentGapPage";
import RankingTrackerPage from "./pages/RankingTrackerPage";
import SEOIntelligencePage from "./pages/SEOIntelligencePage";
import AlertsPage from "./pages/AlertsPage";
import SettingsPage from "./pages/SettingsPage";
import LLMCitationPage from "./pages/LLMCitationPage";
import NotFound from "./pages/NotFound";
import { SEOAIChatbot } from "@/components/SEOAIChatbot";
import { TrialPopup } from "@/components/TrialPopup";
import { CookieConsent } from "@/components/CookieConsent";
import { ScrollToTop } from "@/components/ScrollToTop";
import CookiesPage from "./pages/CookiesPage";
import GDPRPage from "./pages/GDPRPage";
import SecurityPage from "./pages/SecurityPage";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <FilterProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="min-h-screen bg-slate-950 text-slate-100">
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <ScrollToTop />
          <Routes>
            {/* Public Marketing Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingFullPage />} />
                       <Route path="/glossary" element={<SeoGlossaryPage />} />
                       <Route path="/blog" element={<BlogPage />} />
                       <Route path="/blog/:slug" element={<BlogPostPage />} />
                       
                       {/* Free Tools */}
                       <Route path="/free-tools/ai-overview-checker" element={<AiOverviewChecker />} />
                       <Route path="/free-tools/chatgpt-seo-prompts" element={<ChatGptPromptsLibrary />} />
                       <Route path="/free-tools/keyword-clustering" element={<KeywordClusteringTool />} />
                       <Route path="/free-tools/meta-tags-generator" element={<MetaTagsGenerator />} />
                       <Route path="/free-tools/heading-analyzer" element={<HeadingAnalyzer />} />
                       <Route path="/free-tools/robots-txt-generator" element={<RobotsTxtGenerator />} />
                       <Route path="/free-tools/schema-generator" element={<SchemaGenerator />} />
                       <Route path="/free-tools/keyword-density-checker" element={<KeywordDensityChecker />} />
                       <Route path="/privacy" element={<PrivacyPage />} />
                       <Route path="/terms" element={<TermsPage />} />
                       <Route path="/cookies" element={<CookiesPage />} />
                       <Route path="/gdpr" element={<GDPRPage />} />
                       <Route path="/security" element={<SecurityPage />} />
                       
                       {/* Redirect Coming Soon to Contact */}
                       <Route path="/roadmap" element={<ContactPage />} />
                       <Route path="/help" element={<ContactPage />} />
                       <Route path="/guides" element={<ContactPage />} />
                       <Route path="/api" element={<ContactPage />} />
                       <Route path="/careers" element={<ContactPage />} />
                       <Route path="/partners" element={<ContactPage />} />
                       <Route path="/affiliates" element={<ContactPage />} />
                       <Route path="/status" element={<ContactPage />} />
                       
                       <Route path="/auth" element={<Auth />} />
            
            {/* Protected Dashboard Pages */}
            <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
            <Route path="/queries" element={<DashboardLayout><QueriesPage /></DashboardLayout>} />
            <Route path="/pages" element={<DashboardLayout><PagesPage /></DashboardLayout>} />
            <Route path="/countries" element={<DashboardLayout><CountriesPage /></DashboardLayout>} />
            <Route path="/devices" element={<DashboardLayout><DevicesPage /></DashboardLayout>} />
                  <Route path="/cannibalization" element={<DashboardLayout><CannibalizationPage /></DashboardLayout>} />
                  <Route path="/link-opportunities" element={<DashboardLayout><LinkOpportunitiesPage /></DashboardLayout>} />
                  <Route path="/keyword-research" element={<DashboardLayout><KeywordResearchPage /></DashboardLayout>} />
                  <Route path="/competitor-analysis" element={<DashboardLayout><CompetitorAnalysisPage /></DashboardLayout>} />
                  <Route path="/local-seo" element={<DashboardLayout><LocalSeoPage /></DashboardLayout>} />
                  <Route path="/shopping" element={<DashboardLayout><ShoppingPage /></DashboardLayout>} />
                  <Route path="/onpage-seo" element={<DashboardLayout><OnPageSeoPage /></DashboardLayout>} />
                  <Route path="/backlinks" element={<DashboardLayout><BacklinksPage /></DashboardLayout>} />
                  <Route path="/serp-analysis" element={<DashboardLayout><SerpAnalysisPage /></DashboardLayout>} />
                  <Route path="/site-audit" element={<DashboardLayout><SiteAuditPage /></DashboardLayout>} />
                  <Route path="/repurpose" element={<DashboardLayout><RepurposePage /></DashboardLayout>} />
                  <Route path="/keyword-clustering" element={<DashboardLayout><KeywordClusteringPage /></DashboardLayout>} />
                  <Route path="/content-gap" element={<DashboardLayout><ContentGapPage /></DashboardLayout>} />
                  <Route path="/ranking-tracker" element={<DashboardLayout><RankingTrackerPage /></DashboardLayout>} />
                  <Route path="/seo-intelligence" element={<DashboardLayout><SEOIntelligencePage /></DashboardLayout>} />
                  <Route path="/llm-citations" element={<DashboardLayout><LLMCitationPage /></DashboardLayout>} />
                  <Route path="/alerts" element={<DashboardLayout><AlertsPage /></DashboardLayout>} />
                  <Route path="/settings" element={<DashboardLayout><SettingsPage /></DashboardLayout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
                     <SEOAIChatbot />
                     <TrialPopup />
                     <CookieConsent />
                   </BrowserRouter>
        </div>
      </TooltipProvider>
    </FilterProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
