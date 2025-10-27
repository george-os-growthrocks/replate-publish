import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface URLScraperProps {
  onContentScraped: (content: string, metadata?: { url?: string; title?: string; description?: string }) => void;
}

export function URLScraper({ onContentScraped }: URLScraperProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleScrape() {
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to scrape",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (include http:// or https://)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: response, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { url }
      });

      if (error) {
        throw error;
      }

      console.log('Firecrawl response:', response);

      if (!response || !response.success) {
        throw new Error(response?.error || "Scraping failed");
      }

      const scrapedData = response.data;
      
      // Extract content - prefer markdown, fallback to html text
      let content = scrapedData.markdown || "";
      
      if (!content && scrapedData.html) {
        // Simple HTML to text conversion
        content = scrapedData.html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      if (!content) {
        throw new Error("No content could be extracted from the URL");
      }

      // Extract metadata
      const metadata = {
        url: scrapedData.url || url,
        title: scrapedData.title || scrapedData.metadata?.title,
        description: scrapedData.description || scrapedData.metadata?.description,
      };

      onContentScraped(content, metadata);

      toast({
        title: "Content Scraped Successfully",
        description: `Extracted ${content.length} characters from ${metadata.title || url}`,
      });
    } catch (error) {
      console.error('Scraping error:', error);
      toast({
        title: "Scraping Failed",
        description: error instanceof Error ? error.message : "Failed to scrape URL. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Scrape Content from URL</label>
      <div className="flex gap-2">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          disabled={isLoading}
          onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
        />
        <Button
          onClick={handleScrape}
          disabled={isLoading || !url}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              Scrape
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Enter any URL to extract its text content automatically
      </p>
    </div>
  );
}

