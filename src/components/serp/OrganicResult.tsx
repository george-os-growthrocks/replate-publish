import { Badge } from "@/components/ui/badge";
import { Star, Image as ImageIcon, Video, FileText, ChevronRight } from "lucide-react";

interface SiteLink {
  title: string;
  url: string;
}

interface OrganicResultProps {
  position: number;
  title: string;
  url: string;
  description: string;
  favicon?: string;
  rating?: number;
  reviews?: number;
  siteLinks?: SiteLink[];
  hasImage?: boolean;
  hasVideo?: boolean;
  featured?: boolean;
}

export function OrganicResult({
  position,
  title,
  url,
  description,
  favicon,
  rating,
  reviews,
  siteLinks,
  hasImage,
  hasVideo,
  featured = false
}: OrganicResultProps) {
  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const domain = new URL(url).hostname.replace('www.', '');

  return (
    <div className={`group ${featured ? 'p-4 border-2 border-primary/20 rounded-lg bg-primary/5' : 'py-3'}`}>
      {/* Position Badge (only for non-featured) */}
      {!featured && (
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs font-mono">
            #{position}
          </Badge>
        </div>
      )}

      {/* URL and Favicon */}
      <div className="flex items-center gap-2 mb-1">
        {favicon ? (
          <img 
            src={favicon} 
            alt="" 
            className="w-4 h-4 rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-4 h-4 bg-muted rounded flex items-center justify-center text-xs">
            {domain.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm text-muted-foreground truncate">
          {displayUrl}
        </span>
        <div className="flex items-center gap-1">
          {hasImage && (
            <ImageIcon className="w-3 h-3 text-muted-foreground" />
          )}
          {hasVideo && (
            <Video className="w-3 h-3 text-red-500" />
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-primary hover:underline cursor-pointer mb-1 line-clamp-2">
        {title}
      </h3>

      {/* Rating (if exists) */}
      {rating && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {rating} ({reviews} reviews)
          </span>
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-2">
        {description}
      </p>

      {/* Sitelinks */}
      {siteLinks && siteLinks.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 pl-4">
          {siteLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              className="flex items-center gap-1 text-sm text-primary hover:underline group/link"
              onClick={(e) => e.preventDefault()}
            >
              <ChevronRight className="w-3 h-3 opacity-50 group-hover/link:opacity-100 transition-opacity" />
              <span className="truncate">{link.title}</span>
            </a>
          ))}
        </div>
      )}

      {/* Featured Snippet Badge */}
      {featured && (
        <div className="mt-2">
          <Badge variant="default" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            Featured Snippet
          </Badge>
        </div>
      )}
    </div>
  );
}
