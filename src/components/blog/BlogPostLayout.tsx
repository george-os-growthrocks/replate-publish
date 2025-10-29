import { ReactNode, useState } from "react";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, User, Clock, Twitter, Linkedin, Share2, BookOpen } from "lucide-react";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface RelatedLink {
  title: string;
  href: string;
  description?: string;
  type: "tool" | "blog" | "help" | "external";
}

interface BlogPostLayoutProps {
  title: string;
  description?: string;
  categoryBadges: string[];
  date: string;
  authorName?: string;
  readTime?: string;
  breadcrumbs?: BreadcrumbItem[];
  relatedLinks?: RelatedLink[];
  tocItems?: string[];
  children: ReactNode;
}

export function BlogPostLayout({
  title,
  description,
  categoryBadges,
  date,
  authorName = "SEO Team",
  readTime,
  breadcrumbs,
  relatedLinks = [],
  tocItems = [],
  children,
}: BlogPostLayoutProps) {
  const [copied, setCopied] = useState(false);

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank");
  }

  function shareLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank");
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <article className="pt-20">
        <header className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="flex flex-wrap gap-2 mb-6">
              {categoryBadges.map((badge, idx) => (
                <Badge key={idx} className="bg-primary/10 text-primary border-primary/20">
                  {badge}
                </Badge>
              ))}
              {readTime && (
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  {readTime}
                </Badge>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-foreground leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-xl text-muted-foreground mb-4 max-w-3xl">{description}</p>
            )}

            <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{authorName}</div>
                  <div className="text-xs">AnotherSEOGuru</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {date}
              </div>
            </div>

            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <span className="text-sm text-muted-foreground font-medium">Share:</span>
              <Button variant="outline" size="sm" onClick={shareTwitter} className="gap-2">
                <Twitter className="w-4 h-4" />
                Twitter
              </Button>
              <Button variant="outline" size="sm" onClick={shareLinkedIn} className="gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </Button>
              <Button variant="outline" size="sm" onClick={copyUrl} className="gap-2">
                <Share2 className="w-4 h-4" />
                {copied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8">
              <div className="prose prose-lg prose-slate dark:prose-invert prose-headings:text-foreground prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline max-w-none">
                {children}
              </div>
            </div>
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                {tocItems.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-4 text-foreground flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Table of Contents
                      </h3>
                      <nav className="space-y-2">
                        {tocItems.map((item, idx) => (
                          <a key={idx} href={`#toc-${idx}`} className="block text-sm text-muted-foreground hover:text-primary transition-colors py-2 border-b border-border last:border-0">
                            {idx + 1}. {item}
                          </a>
                        ))}
                      </nav>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-bold text-lg mb-3 text-foreground">Try Our Free Tools</h3>
                    <p className="text-sm text-muted-foreground mb-4">Start optimizing your SEO today with no signup required</p>
                    <Button asChild size="sm" className="gradient-primary w-full">
                      <Link to="/free-tools">Browse Free Tools</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
