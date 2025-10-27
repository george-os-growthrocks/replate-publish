import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const glossaryTerms = {
  A: [
    { term: "Anchor Text", definition: "The visible, clickable text in a hyperlink, providing context and indicating the content of the linked page." },
    { term: "Average Position", definition: "The average rank at which a web page appears in search engine results pages (SERPs) for a given keyword." },
    { term: "Algorithm Update", definition: "Changes made by search engines to their ranking algorithms, affecting how web pages are ranked in search results." },
  ],
  B: [
    { term: "Backlink", definition: "A link from one website to another, viewed as a vote of confidence and authority signal by search engines." },
    { term: "Black Hat SEO", definition: "Aggressive and unethical optimization techniques that violate search engine guidelines, risking penalties." },
    { term: "Branded Query", definition: "Search queries that include the name of a brand or company." },
    { term: "Bounce Rate", definition: "The percentage of visitors who leave a website after viewing only one page, indicating poor engagement or irrelevant content." },
  ],
  C: [
    { term: "Clicks", definition: "The number of times users click on a link or element, such as a search result or advertisement, leading to a web page." },
    { term: "Content Groups", definition: "Categories that organize website or app content, enhancing analysis in analytics platforms." },
    { term: "CPC (Cost per Click)", definition: "The amount of money an advertiser pays every time a user clicks on an ad." },
    { term: "Crawler Bot", definition: "An automated program used by search engines to browse and index web pages on the internet." },
    { term: "Crawling", definition: "The process by which search engine bots systematically browse the web, discovering and indexing web pages." },
    { term: "CTR (Click-Through Rate)", definition: "The ratio of clicks to impressions, measuring the percentage of users who click on a link after seeing it." },
    { term: "Cannibalization", definition: "When multiple pages on a website target the same keyword, competing against each other in search results." },
  ],
  D: [
    { term: "Domain Authority", definition: "A metric that predicts a website's ability to rank in search engines based on various factors like backlinks and content quality." },
    { term: "Do-follow Link", definition: "A hyperlink that passes SEO value (link juice) from one page to another, helping improve search rankings." },
  ],
  E: [
    { term: "External Link", definition: "A hyperlink that points from one website to a different website." },
    { term: "E-A-T", definition: "Expertise, Authoritativeness, and Trustworthiness - Google's quality guidelines for evaluating content." },
  ],
  F: [
    { term: "Featured Snippet", definition: "A highlighted search result that appears above organic results, answering a user's query directly." },
    { term: "Follow Link", definition: "A link that allows search engine crawlers to follow it and pass authority to the linked page." },
  ],
  G: [
    { term: "GSC (Google Search Console)", definition: "A free tool from Google that helps website owners understand how their site performs in Google Search, providing key insights and tools to optimize visibility." },
    { term: "Google Algorithm", definition: "The complex system Google uses to retrieve data and deliver the best results for a search query." },
  ],
  H: [
    { term: "H1 Tag", definition: "The main heading tag in HTML, typically used for page titles and important for SEO." },
    { term: "HTTPS", definition: "Secure version of HTTP, encrypting data between browser and server, now a ranking factor." },
    { term: "Hreflang", definition: "An HTML attribute that tells search engines which language and regional URL to show in search results." },
  ],
  I: [
    { term: "Impressions", definition: "The number of times a piece of content, such as a search result or advertisement, is displayed to users." },
    { term: "Indexing", definition: "The process by which search engines crawl and store web pages in their databases for retrieval in search results." },
    { term: "Internal Link", definition: "A hyperlink that points from one page on a website to another page on the same website." },
  ],
  K: [
    { term: "Keyword Cannibalization", definition: "When multiple pages on a website target the same keyword, leading to competition and confusion for search engines." },
    { term: "Keyword Difficulty", definition: "A metric that estimates how hard it is to rank for a keyword in search engine results." },
    { term: "Keyword Volume", definition: "The number of searches for a keyword in a given timeframe, typically monthly." },
    { term: "Keywords", definition: "Words or phrases users type into search engines to find relevant content online." },
    { term: "Knowledge Graph", definition: "Google's system for displaying information boxes with facts about people, places, and things." },
  ],
  L: [
    { term: "Link", definition: "A reference or connection from one web page to another, fundamental to web navigation and SEO." },
    { term: "Link Building", definition: "The process of acquiring backlinks from other websites to improve search rankings." },
    { term: "Local Pack", definition: "The map and business listings that appear in local search results." },
    { term: "Long-tail Keyword", definition: "Longer, more specific keyword phrases with lower search volume but higher conversion rates." },
  ],
  M: [
    { term: "Meta Tags", definition: "Snippets of text that describe a page's content; they don't appear on the page itself but in the page's code." },
    { term: "Meta Description", definition: "An HTML attribute that provides a brief summary of a web page's content for search results." },
    { term: "Mobile-First Indexing", definition: "Google's approach of using the mobile version of a site for indexing and ranking." },
  ],
  N: [
    { term: "Non-Branded Query", definition: "Search queries that don't include specific brand names." },
    { term: "No-follow Link", definition: "A link with a rel='nofollow' attribute that tells search engines not to pass authority." },
    { term: "NAP", definition: "Name, Address, Phone number - critical information for local SEO consistency." },
  ],
  O: [
    { term: "Organic Traffic", definition: "Website visitors who land on a web page through unpaid search engine results." },
    { term: "On-Page SEO", definition: "Optimization techniques applied directly on web pages to improve rankings." },
    { term: "Off-Page SEO", definition: "SEO activities performed outside of your website to improve rankings, primarily link building." },
  ],
  P: [
    { term: "Paid Traffic", definition: "Website visitors who land on a web page through paid advertising campaigns, such as PPC ads." },
    { term: "PPC (Pay per Click)", definition: "A paid marketing strategy where advertisers pay a fee each time their ad is clicked." },
    { term: "Page Speed", definition: "How fast a web page loads, a ranking factor for both desktop and mobile search." },
    { term: "People Also Ask (PAA)", definition: "A SERP feature showing questions related to the user's search query." },
  ],
  Q: [
    { term: "Query", definition: "The words or phrases users enter into search engines to find information." },
    { term: "Quality Score", definition: "A metric used in PPC advertising to measure ad relevance and landing page quality." },
  ],
  R: [
    { term: "Ranking", definition: "The position of a web page in search engine results pages (SERPs) for a given query." },
    { term: "Robots.txt", definition: "A file webmasters use to instruct web crawling bots about which pages to crawl or avoid." },
    { term: "Rich Snippet", definition: "Enhanced search results with additional information like ratings, images, or prices." },
    { term: "Redirect", definition: "A way to send users and search engines to a different URL than originally requested." },
  ],
  S: [
    { term: "Search Queries", definition: "The words or phrases users type into search engines to find information." },
    { term: "Seed Keyword", definition: "The foundation keywords representing core topics or products in keyword research." },
    { term: "SEO (Search Engine Optimization)", definition: "The practice of improving and promoting a website to increase visitors from search engines." },
    { term: "SERP (Search Engine Results Page)", definition: "The page displayed by search engines in response to a query, containing organic and paid results." },
    { term: "Sitemap", definition: "A file listing all pages on a website to help search engines crawl it more intelligently." },
    { term: "Schema Markup", definition: "Code added to websites to help search engines understand content and display rich results." },
    { term: "Site Audit", definition: "A comprehensive analysis of a website's SEO health, identifying technical issues and opportunities." },
  ],
  T: [
    { term: "Technical SEO", definition: "Optimizing website infrastructure and settings to improve search engine crawling, indexing, and rendering." },
    { term: "Title Tag", definition: "An HTML element specifying a web page's title, appearing in search results and browser tabs." },
    { term: "Top Stories", definition: "A SERP feature showing recent news articles relevant to a search query." },
    { term: "Traffic", definition: "The number of visitors to a website, measured by sessions or page views." },
  ],
  U: [
    { term: "URL", definition: "The address used to locate a specific resource, such as a web page or file, on the internet." },
    { term: "User Intent", definition: "The goal a user has when typing a search query, crucial for creating relevant content." },
    { term: "UX Signals", definition: "User experience metrics like bounce rate and dwell time that may influence rankings." },
  ],
  V: [
    { term: "Voice Search", definition: "Using voice commands to search, requiring natural language optimization." },
    { term: "Video Rich Results", definition: "SERP features that display video thumbnails and information directly in search results." },
  ],
  W: [
    { term: "White Hat SEO", definition: "Ethical and legitimate optimization strategies that comply with search engine guidelines." },
    { term: "Web Vitals", definition: "Google's metrics for measuring user experience: LCP, FID, and CLS." },
  ],
  X: [
    { term: "XML Sitemap", definition: "A file listing all important pages on a website to help search engines discover and index content." },
  ],
  Y: [
    { term: "YouTube SEO", definition: "Optimizing videos and channels for better visibility in YouTube and Google search results." },
  ],
  Z: [
    { term: "Zero-Click Search", definition: "When users get their answer directly in search results without clicking through to a website." },
  ],
};

export default function SeoGlossaryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const alphabet = Object.keys(glossaryTerms);

  const filteredTerms = selectedLetter
    ? { [selectedLetter]: glossaryTerms[selectedLetter as keyof typeof glossaryTerms] }
    : glossaryTerms;

  const searchFiltered = searchTerm
    ? Object.entries(filteredTerms).reduce((acc, [letter, terms]) => {
        const filtered = terms.filter(
          (t) =>
            t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.definition.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[letter] = filtered;
        }
        return acc;
      }, {} as typeof filteredTerms)
    : filteredTerms;

  return (
    <>
      <Helmet>
        <title>SEO Glossary - AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="The most comprehensive SEO glossary on the internet. Learn 50+ important SEO terms and concepts from A to Z." 
        />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            {/* Hero */}
            <div className="max-w-4xl mx-auto text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
                SEO{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Glossary
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                The most comprehensive SEO glossary on the internet. Learn the most important SEO terms and concepts.
              </p>

              {/* Search */}
              <div className="relative max-w-md mx-auto mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search terms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12"
                />
              </div>
            </div>

            {/* Alphabet Navigation */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              <button
                onClick={() => {
                  setSelectedLetter(null);
                  setSearchTerm("");
                }}
                className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                  !selectedLetter
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                All
              </button>
              {alphabet.map((letter) => (
                <button
                  key={letter}
                  onClick={() => {
                    setSelectedLetter(letter);
                    setSearchTerm("");
                  }}
                  className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                    selectedLetter === letter
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>

            {/* Terms */}
            <div className="max-w-5xl mx-auto space-y-12">
              {Object.entries(searchFiltered).map(([letter, terms]) => (
                <div key={letter}>
                  <h2 className="text-4xl font-bold mb-6 text-foreground">{letter}</h2>
                  <div className="space-y-4">
                    {terms.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-colors"
                      >
                        <h3 className="text-xl font-semibold mb-2 text-foreground">{item.term}</h3>
                        <p className="text-muted-foreground">{item.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(searchFiltered).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-xl text-muted-foreground">
                    No terms found matching "{searchTerm}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

