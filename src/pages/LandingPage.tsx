import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";

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
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        <Hero />
        <FeaturesSection />
        <PricingSection />
        <Footer />
      </div>
    </>
  );
}

