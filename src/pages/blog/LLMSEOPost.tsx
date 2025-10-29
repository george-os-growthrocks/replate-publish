import { Helmet } from "react-helmet-async";
import { BlogPostLayout } from "@/components/blog/BlogPostLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, CheckCircle2 } from "lucide-react";

export default function LLMSEOPost() {
  return (
    <>
      <Helmet>
        <title>LLM SEO: How to Get Cited by ChatGPT & Perplexity</title>
        <meta 
          name="description" 
          content="A field guide to earning citations in ChatGPT and Perplexity: Q&A formatting, freshness, source-worthiness, schema, and measurement." 
        />
        <link rel="canonical" href="https://anotherseoguru.com/blog/llm-seo-chatgpt-perplexity" />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content="2025-10-28T10:00:00Z" />
        <meta property="article:modified_time" content="2025-10-28T10:00:00Z" />
      </Helmet>

      <BlogPostLayout
        title="LLM SEO: How to Get Cited by ChatGPT & Perplexity"
        description="Optimize for answer engines: Q&A formatting, freshness, source-worthiness, schema, and measurement."
        categoryBadges={["AI Search", "Answer Engines", "LLM Optimization"]}
        date="October 28, 2025"
        readTime="7 min read"
        tocItems={[
          "Start with extraction-ready pages",
          "Signal freshness and accountability",
          "Be the best explainer on narrow intents",
          "Architect for coverage",
          "Measure reality, not vibes",
          "Technical hygiene still matters",
          "What good looks like",
          "Reality check",
          "30-Day LLM SEO Playbook",
          "Citation-Worthy Checklist",
          "Common Mistakes",
          "FAQ"
        ]}
      >
        <p className="lead">
          The search landscape now includes answer engines that summarize the web and link to sources. If you want durable visibility, optimize not just for blue links but for citation-worthiness.
        </p>

        <h2>Start with extraction-ready pages</h2>
        <p>
          LLMs extract short, unambiguous answers. Put a direct answer (≤120 words) at the top, followed by context, examples, and a concise table/FAQ. Use <Link to="/free-tools/schema-generator">FAQPage/HowTo schema</Link> where relevant to reduce ambiguity for parsers.
        </p>

        <h2>Signal freshness and accountability</h2>
        <p>
          Prominently show <strong>Updated on (YYYY-MM-DD)</strong> and summarize what changed. Add bylines with credentials, outbound citations to primary sources, and an editorial policy page. These are credibility signals for humans and machines alike.
        </p>

        <h2>Be the best explainer on narrow intents</h2>
        <p>
          Pick intent gaps—e.g., "hreflang for subfolders vs. ccTLDs"—and become the canonical explainer. LLMs often favor documents that are both focused and complete over sprawling, generic guides.
        </p>

        <h2>Architect for coverage</h2>
        <p>
          Create a topic hub (entity page) with internal anchors to specific Q&A leaves. This increases your chance of being cited for multiple sub-questions in the same answer card.
        </p>

        <h2>Measure reality, not vibes</h2>
        <p>
          Add GA4 filters for <code>perplexity.ai</code> and <code>chat.openai.com</code> referrals, and do periodic manual checks for target queries. Track which of your pages vs. competitors are cited—and why (clarity, tables, freshness, brand authority).
        </p>

        <h2>Technical hygiene still matters</h2>
        <p>
          Ensure fast TTFB, stable CLS, and a crawlable page. If an answer engine times out or struggles to render, you're invisible. Keep canonical signals consistent and avoid JS-only content for your key answers. Use our <Link to="/free-tools/cwv-pulse">CWV Pulse tool</Link> to monitor performance.
        </p>

        <h2>What good looks like</h2>
        <ul>
          <li>A crisp intro that answers the query directly</li>
          <li>A 5-row table that compares options and trade-offs</li>
          <li>A compact FAQ with three predictable follow-ups</li>
          <li>Visible last-updated date and change notes</li>
          <li>Links to primary sources (RFCs, official docs)</li>
        </ul>

        <h2>Reality check</h2>
        <p>
          There's no "submit to ChatGPT" button. You win by publishing pages that LLMs love to extract and cite—clear, current, and credible. Treat it like PR for machines: be quotable, be reliable, be fast.
        </p>

        <Card className="not-prose my-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/20">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3">Optimize for AI Search Engines</h3>
              <p className="text-muted-foreground mb-6">
                Use our AI-powered tools to analyze your content for ChatGPT and Perplexity citations
              </p>
              <div className="flex gap-4">
                <Button asChild size="lg" className="gradient-primary">
                  <Link to="/free-tools/ai-overview-checker">
                    Check AI Overview
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/free-tools/chatgpt-seo-prompts">
                    ChatGPT Prompts
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <h2>The 30-Day LLM SEO Playbook</h2>
        <p>Here's a practical timeline for optimizing your content for AI search engines:</p>

        <h3>Week 1: Audit & Structure</h3>
        <ul>
          <li>Identify your top 10 money pages</li>
          <li>Add 120-word direct answers at the top of each</li>
          <li>Implement <Link to="/free-tools/schema-generator">FAQPage schema</Link> where relevant</li>
          <li>Check <Link to="/free-tools/cwv-pulse">page speed scores</Link> and fix critical issues</li>
        </ul>

        <h3>Week 2-3: Enhance Authority Signals</h3>
        <ul>
          <li>Add "Updated on" dates to all articles</li>
          <li>Create author bios with credentials</li>
          <li>Add outbound citations to primary sources (studies, official docs)</li>
          <li>Build an editorial policy page</li>
        </ul>

        <h3>Week 4: Measure & Iterate</h3>
        <ul>
          <li>Set up GA4 filters for chat.openai.com and perplexity.ai referrers</li>
          <li>Manually test top queries in Perplexity</li>
          <li>Track which pages get cited and why</li>
          <li>Double down on what works</li>
        </ul>

        <h2>The Citation-Worthy Content Checklist</h2>
        <div className="not-prose my-6 space-y-2">
          {[
            "Direct answer (≤120 words) in first paragraph",
            "At least one comparison table",
            "3-5 FAQ questions with concise answers",
            "Visible last-updated date with changelog",
            "Author bio with credentials",
            "Links to 2-3 primary sources",
            "LCP <2.5s and CLS <0.1",
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>

        <h2>Common Mistakes to Avoid</h2>
        <h3>1. Trying to Game the System</h3>
        <p>
          LLMs are sophisticated. Keyword stuffing or fake expertise will backfire. Focus on being genuinely helpful and cited sources will follow.
        </p>
        <h3>2. Ignoring Traditional SEO</h3>
        <p>
          LLM visibility complements—not replaces—traditional SEO. You still need backlinks, technical health, and topical authority. Use our <Link to="/dashboard">SEO dashboard</Link> to track both.
        </p>
        <h3>3. Writing for Machines Only</h3>
        <p>
          Optimize for extraction, but write for humans first. If your content reads like a FAQ bot, engagement will tank and LLMs will notice the lack of natural language.
        </p>
      </BlogPostLayout>

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "LLM SEO: How to Get Cited by ChatGPT & Perplexity",
          "description": "A field guide to earning citations in ChatGPT and Perplexity: Q&A formatting, freshness, source-worthiness, schema, and measurement.",
          "image": "https://anotherseoguru.com/hero-image.jpg",
          "datePublished": "2025-10-28T10:00:00Z",
          "dateModified": "2025-10-28T10:00:00Z",
          "author": {"@type": "Organization", "name": "AnotherSEOGuru", "url": "https://anotherseoguru.com"},
          "publisher": {"@type": "Organization", "name": "AnotherSEOGuru", "logo": {"@type": "ImageObject", "url": "https://anotherseoguru.com/logo-icon.png"}},
          "mainEntityOfPage": {"@type": "WebPage", "@id": "https://anotherseoguru.com/blog/llm-seo-chatgpt-perplexity"}
        })}
      </script>
    </>
  );
}

