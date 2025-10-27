import { Card } from "@/components/ui/card";
import { Globe, ExternalLink } from "lucide-react";

interface SERPPreviewProps {
  title: string;
  description: string;
  url?: string;
}

export function SERPPreview({ title, description, url = "https://amplify.app/blog/example-post" }: SERPPreviewProps) {
  // Truncate title to ~60 characters
  const displayTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
  
  // Truncate description to ~160 characters
  const displayDescription = description.length > 160 
    ? description.substring(0, 157) + '...' 
    : description;

  const titleLength = title.length || 0;
  const descLength = description.length || 0;

  return (
    <Card className="p-6 shadow-strong">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          Google SERP Preview
        </h3>
        <div className="flex gap-3 text-xs">
          <span className={titleLength > 60 ? 'text-destructive font-medium' : 'text-primary'}>
            Title: {titleLength}/60
          </span>
          <span className={descLength > 160 ? 'text-destructive font-medium' : 'text-primary'}>
            Desc: {descLength}/160
          </span>
        </div>
      </div>
      
      {/* Google SERP Simulation */}
      <div className="p-4 bg-white dark:bg-slate-950 rounded-lg border-2 border-muted space-y-2">
        {/* URL breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">
            {url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-xl text-[#1a0dab] dark:text-blue-400 hover:underline cursor-pointer font-normal leading-tight">
          {displayTitle || 'Your SEO Title Will Appear Here | Brand Name'}
        </h4>

        {/* Description */}
        <p className="text-sm text-[#4d5156] dark:text-slate-300 leading-relaxed">
          {displayDescription || 'Your compelling meta description will appear here. Make it engaging and informative to improve click-through rates from search engine results pages.'}
        </p>
      </div>

      {/* Character Count Indicators */}
      <div className="mt-4 space-y-2 text-xs">
        {/* Title Status */}
        <div className="flex items-center justify-between p-2 rounded bg-muted/30">
          <span className="text-muted-foreground">Title Length</span>
          <div className="flex items-center gap-2">
            {titleLength === 0 ? (
              <span className="text-muted-foreground">Not set</span>
            ) : titleLength <= 60 ? (
              <span className="text-green-600 dark:text-green-500 font-medium">✓ Optimal ({titleLength}/60)</span>
            ) : (
              <span className="text-destructive font-medium">⚠ Too long ({titleLength}/60)</span>
            )}
          </div>
        </div>

        {/* Description Status */}
        <div className="flex items-center justify-between p-2 rounded bg-muted/30">
          <span className="text-muted-foreground">Description Length</span>
          <div className="flex items-center gap-2">
            {descLength === 0 ? (
              <span className="text-muted-foreground">Not set</span>
            ) : descLength >= 140 && descLength <= 160 ? (
              <span className="text-green-600 dark:text-green-500 font-medium">✓ Optimal ({descLength}/160)</span>
            ) : descLength < 140 ? (
              <span className="text-amber-600 dark:text-amber-500 font-medium">○ Short ({descLength}/160)</span>
            ) : (
              <span className="text-destructive font-medium">⚠ Too long ({descLength}/160)</span>
            )}
          </div>
        </div>
      </div>

      {/* SEO Tips */}
      <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-xs font-semibold mb-2">SEO Best Practices:</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>✓ Title: 50-60 characters ideal</li>
          <li>✓ Description: 140-160 characters ideal</li>
          <li>✓ Include primary keyword naturally</li>
          <li>✓ Write compelling copy to increase CTR</li>
        </ul>
      </div>
    </Card>
  );
}

