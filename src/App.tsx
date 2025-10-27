import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FilterProvider } from "@/contexts/FilterContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
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
import AlertsPage from "./pages/AlertsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
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
                  <Route path="/alerts" element={<DashboardLayout><AlertsPage /></DashboardLayout>} />
                  <Route path="/settings" element={<DashboardLayout><SettingsPage /></DashboardLayout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </div>
      </TooltipProvider>
    </FilterProvider>
  </QueryClientProvider>
);

export default App;
