import {
  FileText,
  Search,
  Code,
  Globe,
  Map,
  FileSearch,
  Gauge,
  Shield,
  Link2,
  Image,
  Layers,
  BarChart3,
  Zap,
  Share2,
  Bot,
  Brain,
  Target,
} from "lucide-react";

export interface FreeTool {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: any;
  category: "on-page" | "technical" | "content" | "research" | "social";
  relatedTools: string[]; // IDs of related tools
  relatedCourse?: string;
  status: "live" | "coming-soon";
}

export const freeToolsData: FreeTool[] = [
  // On-Page Tools
  {
    id: "meta-tags",
    title: "Title & SERP Snippet Simulator",
    description: "Preview how your meta tags appear in search results. Pixel-perfect for desktop and mobile.",
    href: "/free-tools/meta-tags-generator",
    icon: FileText,
    category: "on-page",
    relatedTools: ["heading-analyzer", "schema-generator", "og-preview"],
    relatedCourse: "Google SEO Fundamentals",
    status: "live",
  },
  {
    id: "heading-analyzer",
    title: "Heading Structure Analyzer",
    description: "Analyze H1-H6 hierarchy and get optimization recommendations for better content structure.",
    href: "/free-tools/heading-analyzer",
    icon: Layers,
    category: "on-page",
    relatedTools: ["meta-tags", "keyword-density"],
    status: "live",
  },
  {
    id: "schema-generator",
    title: "Schema Markup Generator",
    description: "Generate JSON-LD structured data for FAQ, HowTo, Article, Product, and more.",
    href: "/free-tools/schema-generator",
    icon: Code,
    category: "on-page",
    relatedTools: ["meta-tags", "paa-extractor"],
    relatedCourse: "Schema That Matters in 2026",
    status: "live",
  },
  {
    id: "og-preview",
    title: "Open Graph & Twitter Card Previewer",
    description: "Preview how your content looks when shared on social media platforms.",
    href: "/free-tools/og-preview",
    icon: Share2,
    category: "social",
    relatedTools: ["meta-tags"],
    status: "coming-soon",
  },

  // Technical SEO
  {
    id: "robots-txt",
    title: "Robots.txt & Meta Robots Tester",
    description: "Test robots.txt directives and meta robots tags to avoid indexing accidents.",
    href: "/free-tools/robots-txt-generator",
    icon: Shield,
    category: "technical",
    relatedTools: ["canonical-checker", "hreflang-builder"],
    relatedCourse: "Technical SEO Course",
    status: "live",
  },
  {
    id: "hreflang-builder",
    title: "Hreflang Tag Builder & Validator",
    description: "Generate and validate hreflang tags for international SEO without tears.",
    href: "/free-tools/hreflang-builder",
    icon: Globe,
    category: "technical",
    relatedTools: ["robots-txt", "schema-generator"],
    relatedCourse: "Hreflang Without Tears",
    status: "live",
  },
  {
    id: "canonical-checker",
    title: "Canonical & Duplicate Finder",
    description: "Find canonical conflicts and duplicate content issues across your site.",
    href: "/free-tools/canonical-checker",
    icon: Link2,
    category: "technical",
    relatedTools: ["hreflang-builder", "redirect-mapper"],
    status: "coming-soon",
  },
  {
    id: "redirect-mapper",
    title: "Redirect Map Builder (301/308)",
    description: "Create clean redirect maps for site migrations with regex support.",
    href: "/free-tools/redirect-mapper",
    icon: Map,
    category: "technical",
    relatedTools: ["canonical-checker", "log-analyzer"],
    relatedCourse: "Site Migrations Runbook",
    status: "coming-soon",
  },
  {
    id: "log-analyzer",
    title: "Log-File Lite Analyzer",
    description: "Upload access logs to spot crawl waste, 4xx/5xx patterns, and orphan pages.",
    href: "/free-tools/log-analyzer",
    icon: FileSearch,
    category: "technical",
    relatedTools: ["robots-txt", "cwv-pulse"],
    relatedCourse: "Log-File SEO Guide",
    status: "coming-soon",
  },
  {
    id: "cwv-pulse",
    title: "CWV Pulse (Core Web Vitals)",
    description: "Check LCP, INP, and CLS scores with actionable recommendations.",
    href: "/free-tools/cwv-pulse",
    icon: Gauge,
    category: "technical",
    relatedTools: ["robots-txt", "heading-analyzer"],
    relatedCourse: "CWV for Execs",
    status: "live",
  },
  {
    id: "image-optimizer",
    title: "Image SEO Auditor",
    description: "Find missing alt tags, oversized images, and optimization opportunities.",
    href: "/free-tools/image-optimizer",
    icon: Image,
    category: "technical",
    relatedTools: ["cwv-pulse", "heading-analyzer"],
    status: "coming-soon",
  },

  // Research & Content
  {
    id: "paa-extractor",
    title: "People-Also-Ask Extractor",
    description: "Extract PAA questions and turn them into content briefs in seconds.",
    href: "/free-tools/paa-extractor",
    icon: Search,
    category: "research",
    relatedTools: ["keyword-clustering", "chatgpt-prompts", "schema-generator"],
    relatedCourse: "Internal Linking at Scale",
    status: "live",
  },
  {
    id: "keyword-clustering",
    title: "Keyword Clustering Tool",
    description: "Upload GSC exports and cluster keywords by intent for smart internal linking.",
    href: "/free-tools/keyword-clustering",
    icon: Layers,
    category: "research",
    relatedTools: ["paa-extractor", "keyword-density"],
    relatedCourse: "Internal Linking at Scale",
    status: "live",
  },
  {
    id: "keyword-density",
    title: "Keyword Density Checker",
    description: "Analyze keyword usage and semantic relevance in your content.",
    href: "/free-tools/keyword-density-checker",
    icon: BarChart3,
    category: "content",
    relatedTools: ["keyword-clustering", "heading-analyzer"],
    status: "live",
  },
  {
    id: "chatgpt-prompts",
    title: "ChatGPT SEO Prompt Library",
    description: "100+ proven SEO prompts for content, research, and optimization.",
    href: "/free-tools/chatgpt-seo-prompts",
    icon: Brain,
    category: "content",
    relatedTools: ["paa-extractor", "ai-overview"],
    relatedCourse: "Answer-Engine Optimization",
    status: "live",
  },
  {
    id: "ai-overview",
    title: "AI Overview Checker",
    description: "Check if AI Overviews appear for your keywords and see which sites are featured.",
    href: "/free-tools/ai-overview-checker",
    icon: Bot,
    category: "research",
    relatedTools: ["chatgpt-prompts", "paa-extractor"],
    relatedCourse: "Answer-Engine Optimization",
    status: "live",
  },
  {
    id: "search-operators",
    title: "Search Operators Builder",
    description: "Build advanced Google search queries with visual operator composer. Combine site:, intitle:, filetype: and more.",
    href: "/free-tools/search-operators",
    icon: Target,
    category: "research",
    relatedTools: ["ai-overview", "paa-extractor", "keyword-clustering"],
    relatedCourse: "Google Search Operators Playbook",
    status: "live",
  },
];

export function getRelatedTools(toolId: string, limit: number = 3): FreeTool[] {
  const currentTool = freeToolsData.find(t => t.id === toolId);
  if (!currentTool) return [];

  const relatedIds = currentTool.relatedTools.slice(0, limit);
  return freeToolsData.filter(t => relatedIds.includes(t.id));
}

export function getToolsByCategory(category: FreeTool['category']): FreeTool[] {
  return freeToolsData.filter(t => t.category === category);
}

export function getAllLiveTools(): FreeTool[] {
  return freeToolsData.filter(t => t.status === "live");
}

export function getToolById(id: string): FreeTool | undefined {
  return freeToolsData.find(t => t.id === id);
}

