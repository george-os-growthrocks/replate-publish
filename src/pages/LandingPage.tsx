import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { ProblemSolutionSection } from "@/components/landing/ProblemSolutionSection";
import { ClientsSection } from "@/components/landing/ClientsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { Footer } from "@/components/landing/Footer";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/seo";

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>AnotherSEOGuru - The Most Advanced SEO Platform + AI Content Engine</title>
        <meta 
          name="description" 
          content="Track SERP rankings, analyze competitors, research keywords, monitor backlinks, run technical audits, and generate AI-powered content. The complete SEO platform for dominating search." 
        />
        <meta 
          name="keywords" 
          content="SEO tools, SERP tracking, keyword research, backlink monitoring, competitor analysis, technical SEO, AI content generation, site audit, ranking tracker" 
        />
        <link rel="canonical" href="https://anotherseoguru.com/" />
        <meta property="og:title" content="AnotherSEOGuru - The Most Advanced SEO Platform + AI Content Engine" />
        <meta property="og:description" content="Track SERP rankings, analyze competitors, research keywords, monitor backlinks, run technical audits, and generate AI-powered content. The complete SEO platform." />
        <meta property="og:url" content="https://anotherseoguru.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://anotherseoguru.com/logo-icon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AnotherSEOGuru - Advanced SEO Platform" />
        <meta name="twitter:description" content="Complete SEO platform with AI content generation. Track rankings, analyze competitors, and dominate search." />
        <meta name="twitter:image" content="https://anotherseoguru.com/logo-icon.png" />
      </Helmet>
      <OrganizationJsonLd />
      <WebsiteJsonLd />
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        <Hero />
        <ProblemSolutionSection />
        <FeaturesSection />
        <ClientsSection />
        <ComparisonSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <Footer />
      </div>
    </>
  );
}

