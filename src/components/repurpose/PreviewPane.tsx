import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Download, 
  Check, 
  Sparkles, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Loader2,
  Zap,
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { platforms } from "./PlatformSelector";

export interface GeneratedContent {
  platform: string;
  content: string;
}

interface PreviewPaneProps {
  generatedContent: GeneratedContent[];
  isGenerating: boolean;
}

const platformColors: Record<string, string> = {
  linkedin: "bg-[hsl(201,100%,35%)] dark:bg-[hsl(201,100%,45%)]",
  twitter: "bg-[hsl(203,89%,53%)] dark:bg-[hsl(203,89%,63%)]",
  instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
  youtube: "bg-[hsl(0,100%,50%)] dark:bg-[hsl(0,100%,60%)]",
  blog: "bg-primary dark:bg-primary",
  medium: "bg-[hsl(0,0%,0%)] dark:bg-[hsl(0,0%,90%)]",
  newsletter: "bg-primary dark:bg-primary",
  reddit: "bg-[hsl(16,100%,50%)] dark:bg-[hsl(16,100%,60%)]",
  podcast: "bg-amber-600 dark:bg-amber-700",
  quora: "bg-[hsl(357,75%,53%)] dark:bg-[hsl(357,75%,63%)]",
  tiktok: "bg-[hsl(349,100%,50%)] dark:bg-[hsl(349,100%,60%)]",
};

// Platform-specific preview renderers
function MediumPreview({ content }: { content: string }) {
  return (
    <Card className="max-w-3xl mx-auto bg-white dark:bg-gray-900 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0 overflow-hidden">
          <span className="text-white dark:text-black font-serif font-bold text-lg">YB</span>
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-white">Your Brand</div>
          <div className="text-sm text-gray-500">5 min read • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        </div>
      </div>
      <div className="prose prose-lg max-w-none dark:prose-invert font-serif">
        <div 
          className="text-gray-900 dark:text-gray-100 leading-relaxed"
          dangerouslySetInnerHTML={{ 
            __html: content
              .split('\n\n')
              .map(para => {
                // Handle horizontal rules
                if (para.trim() === '---' || para.trim() === '***') {
                  return '<hr class="my-6 border-gray-300 dark:border-gray-700">';
                }
                // Handle headings
                if (para.startsWith('# ')) {
                  return `<h1 class="text-3xl font-bold mb-4 mt-6 font-serif text-gray-900 dark:text-white">${para.substring(2)}</h1>`;
                }
                if (para.startsWith('## ')) {
                  return `<h2 class="text-2xl font-bold mb-3 mt-5 font-serif text-gray-900 dark:text-white">${para.substring(3)}</h2>`;
                }
                if (para.startsWith('### ')) {
                  return `<h3 class="text-xl font-semibold mb-3 mt-4 font-serif text-gray-900 dark:text-white">${para.substring(4)}</h3>`;
                }
                // Handle unordered lists
                if (para.match(/^[-*]\s/m)) {
                  const items = para.split('\n').filter(line => line.trim()).map(line => {
                    if (line.match(/^[-*]\s/)) {
                      let itemText = line.substring(2);
                      // Format bold/italic/links in list items
                      itemText = itemText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
                      itemText = itemText.replace(/\*(.*?)\*/g, '<em>$1</em>');
                      itemText = itemText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-blue-600 dark:text-blue-400 hover:underline" href="$2">$1</a>');
                      return `<li class="mb-2">${itemText}</li>`;
                    }
                    return '';
                  }).join('');
                  return `<ul class="list-disc pl-6 mb-4 space-y-1">${items}</ul>`;
                }
                // Handle ordered lists
                if (para.match(/^\d+\.\s/m)) {
                  const items = para.split('\n').filter(line => line.trim()).map(line => {
                    if (line.match(/^\d+\.\s/)) {
                      let itemText = line.replace(/^\d+\.\s/, '');
                      // Format bold/italic/links in list items
                      itemText = itemText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
                      itemText = itemText.replace(/\*(.*?)\*/g, '<em>$1</em>');
                      itemText = itemText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-blue-600 dark:text-blue-400 hover:underline" href="$2">$1</a>');
                      return `<li class="mb-2">${itemText}</li>`;
                    }
                    return '';
                  }).join('');
                  return `<ol class="list-decimal pl-6 mb-4 space-y-1">${items}</ol>`;
                }
                // Handle regular paragraphs
                let formatted = para.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
                formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
                formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-blue-600 dark:text-blue-400 hover:underline" href="$2">$1</a>');
                return `<p class="mb-4 leading-relaxed text-lg font-serif">${formatted}</p>`;
              })
              .join('')
          }}
        />
      </div>
    </Card>
  );
}

function LinkedInPreview({ content }: { content: string }) {
  // Parse content into structured blocks
  const parseLinkedInContent = (text: string): string => {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map(para => {
      // Handle ordered lists
      if (para.match(/^\d+\.\s/m)) {
        const items = para.split('\n').filter(line => line.trim()).map(line => {
          if (line.match(/^\d+\.\s/)) {
            let itemText = line.replace(/^\d+\.\s/, '');
            // Format bold/links in list items
            itemText = itemText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
            itemText = itemText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-blue-600 dark:text-blue-400 hover:underline font-medium" href="$2">$1</a>');
            return `<li>${itemText}</li>`;
          }
          return '';
        }).join('');
        return `<ol class="list-decimal pl-5 mb-3 space-y-1">${items}</ol>`;
      }
      
      // Handle unordered lists
      if (para.match(/^[-*]\s/m)) {
        const items = para.split('\n').filter(line => line.trim()).map(line => {
          if (line.match(/^[-*]\s/)) {
            let itemText = line.substring(2);
            // Format bold/links in list items
            itemText = itemText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
            itemText = itemText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-blue-600 dark:text-blue-400 hover:underline font-medium" href="$2">$1</a>');
            return `<li>${itemText}</li>`;
          }
          return '';
        }).join('');
        return `<ul class="list-disc pl-5 mb-3 space-y-1">${items}</ul>`;
      }
      
      // Handle regular paragraphs
      let formatted = para.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
      formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-blue-600 dark:text-blue-400 hover:underline font-medium" href="$2">$1</a>');
      return `<p class="mb-3 leading-relaxed">${formatted}</p>`;
    }).join('');
  };

  return (
    <Card className="max-w-2xl mx-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold shrink-0 overflow-hidden">
            YB
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-white">Your Brand</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Marketing Expert | Content Strategist</div>
            <div className="text-xs text-gray-500 dark:text-gray-500">1h • 🌐</div>
          </div>
          <MoreHorizontal className="w-5 h-5 text-gray-600" />
        </div>
        
        <div className="prose prose-sm max-w-none dark:prose-invert mb-4 text-gray-900 dark:text-gray-100">
          <div dangerouslySetInnerHTML={{ __html: parseLinkedInContent(content) }} />
        </div>

        <div className="flex items-center justify-between py-2 border-t border-b border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">234 reactions</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">45 comments • 12 shares</div>
        </div>

        <div className="flex items-center justify-around py-2">
          <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded">
            <ThumbsUp className="w-5 h-5" />
            <span className="font-medium">Like</span>
          </button>
          <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Comment</span>
          </button>
          <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-4 py-2 rounded">
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Share</span>
          </button>
        </div>
      </div>
    </Card>
  );
}

function TwitterPreview({ content }: { content: string }) {
  // Parse Twitter thread content
  const parseTwitterContent = (text: string): string => {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map(para => {
      // Handle horizontal rules
      if (para.trim() === '---' || para.trim() === '***') {
        return '<hr class="my-3 border-gray-300 dark:border-gray-700">';
      }
      
      // Handle regular paragraphs
      let formatted = para.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-blue-500 hover:underline font-medium" href="$2">$1</a>');
      return `<p class="mb-2 leading-normal">${formatted}</p>`;
    }).join('');
  };

  return (
    <Card className="max-w-xl mx-auto bg-white dark:bg-black border-gray-200 dark:border-gray-800">
      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold shrink-0 overflow-hidden">
            YB
          </div>
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-1 mb-1">
              <span className="font-bold text-gray-900 dark:text-white">Your Brand</span>
              <span className="text-blue-500">✓</span>
              <span className="text-gray-500 dark:text-gray-400">@yourbrand • 2h</span>
            </div>

            {/* Thread Content */}
            <div className="prose prose-sm max-w-none dark:prose-invert text-gray-900 dark:text-white mb-3">
              <div dangerouslySetInnerHTML={{ __html: parseTwitterContent(content) }} />
            </div>

            {/* Engagement Buttons */}
            <div className="flex items-center justify-between max-w-md text-gray-500 dark:text-gray-400">
              <button className="flex items-center gap-2 hover:text-blue-500 transition-colors group">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">42</span>
              </button>
              <button className="flex items-center gap-2 hover:text-green-500 transition-colors group">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="m2 9 3-3 3 3"></path>
                  <path d="M13 18H7a2 2 0 0 1-2-2V6"></path>
                  <path d="m22 15-3 3-3-3"></path>
                  <path d="M11 6h6a2 2 0 0 1 2 2v10"></path>
                </svg>
                <span className="text-sm">128</span>
              </button>
              <button className="flex items-center gap-2 hover:text-red-500 transition-colors group">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>
                <span className="text-sm">1.2K</span>
              </button>
              <button className="flex items-center gap-2 hover:text-blue-500 transition-colors group">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function BlogPreview({ content }: { content: string }) {
  // Parse SEO Blog content with full formatting support
  const parseBlogContent = (text: string): string => {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map(para => {
      // Handle horizontal rules
      if (para.trim() === '---' || para.trim() === '***') {
        return '<hr class="my-6 border-gray-300 dark:border-gray-700">';
      }
      
      // Handle H1 headings
      if (para.startsWith('# ')) {
        let heading = para.substring(2);
        heading = heading.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
        return `<h1 class="text-3xl font-bold mb-4 mt-6 text-gray-900 dark:text-white">${heading}</h1>`;
      }
      
      // Handle H2 headings
      if (para.startsWith('## ')) {
        let heading = para.substring(3);
        heading = heading.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
        return `<h2 class="text-2xl font-bold mb-3 mt-5 text-gray-900 dark:text-white">${heading}</h2>`;
      }
      
      // Handle H3 headings
      if (para.startsWith('### ')) {
        let heading = para.substring(4);
        heading = heading.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
        return `<h3 class="text-xl font-semibold mb-3 mt-4 text-gray-900 dark:text-white">${heading}</h3>`;
      }
      
      // Handle ordered lists
      if (para.match(/^\d+\.\s/m)) {
        const items = para.split('\n').filter(line => line.trim()).map(line => {
          if (line.match(/^\d+\.\s/)) {
            let itemText = line.replace(/^\d+\.\s/, '');
            itemText = itemText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
            itemText = itemText.replace(/\*(.*?)\*/g, '<em>$1</em>');
            itemText = itemText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-blue-600 dark:text-blue-400 hover:underline" href="$2">$1</a>');
            itemText = itemText.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">$1</code>');
            return `<li>${itemText}</li>`;
          }
          return '';
        }).join('');
        return `<ol class="list-decimal pl-6 mb-4 space-y-2">${items}</ol>`;
      }
      
      // Handle unordered lists
      if (para.match(/^[-*]\s/m)) {
        const items = para.split('\n').filter(line => line.trim()).map(line => {
          if (line.match(/^[-*]\s/)) {
            let itemText = line.substring(2);
            itemText = itemText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
            itemText = itemText.replace(/\*(.*?)\*/g, '<em>$1</em>');
            itemText = itemText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-blue-600 dark:text-blue-400 hover:underline" href="$2">$1</a>');
            itemText = itemText.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">$1</code>');
            return `<li>${itemText}</li>`;
          }
          return '';
        }).join('');
        return `<ul class="list-disc pl-6 mb-4 space-y-2">${items}</ul>`;
      }
      
      // Handle code blocks
      if (para.startsWith('```')) {
        const codeContent = para.replace(/```[\w]*\n?/, '').replace(/\n?```$/, '');
        return `<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 overflow-x-auto"><code class="text-sm">${codeContent}</code></pre>`;
      }
      
      // Handle regular paragraphs
      let formatted = para.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-blue-600 dark:text-blue-400 hover:underline" href="$2">$1</a>');
      formatted = formatted.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">$1</code>');
      
      // Check for special tags like <br>
      if (formatted.includes('&lt;br&gt;')) {
        formatted = formatted.replace(/&lt;br&gt;/g, '<br>');
      }
      
      return `<p class="mb-4 leading-relaxed text-base">${formatted}</p>`;
    }).join('');
  };

  return (
    <Card className="max-w-4xl mx-auto bg-white dark:bg-gray-900 p-8">
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <div dangerouslySetInnerHTML={{ __html: parseBlogContent(content) }} />
      </div>
    </Card>
  );
}

function RedditPreview({ content }: { content: string }) {
  // Parse Reddit content
  const parseRedditContent = (text: string): string => {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map(para => {
      // Handle horizontal rules
      if (para.trim() === '---' || para.trim() === '***') {
        return '<hr class="my-3 border-gray-300 dark:border-gray-700">';
      }
      
      // Handle headings
      if (para.startsWith('### ')) {
        return `<h3 class="text-sm font-semibold mb-1 mt-2 text-gray-900 dark:text-white">${para.substring(4)}</h3>`;
      }
      if (para.startsWith('## ')) {
        return `<h2 class="text-base font-semibold mb-2 mt-3 text-gray-900 dark:text-white">${para.substring(3)}</h2>`;
      }
      
      // Handle ordered lists
      if (para.match(/^\d+\.\s/m)) {
        const items = para.split('\n').filter(line => line.trim()).map(line => {
          if (line.match(/^\d+\.\s/)) {
            let itemText = line.replace(/^\d+\.\s/, '');
            itemText = itemText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
            itemText = itemText.replace(/\*(.*?)\*/g, '<em>$1</em>');
            itemText = itemText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-blue-600 dark:text-blue-400 hover:underline" href="$2">$1</a>');
            return `<li>${itemText}</li>`;
          }
          return '';
        }).join('');
        return `<ol class="list-decimal pl-5 mb-3 space-y-1">${items}</ol>`;
      }
      
      // Handle unordered lists
      if (para.match(/^[-*]\s/m)) {
        const items = para.split('\n').filter(line => line.trim()).map(line => {
          if (line.match(/^[-*]\s/)) {
            let itemText = line.substring(2);
            itemText = itemText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
            itemText = itemText.replace(/\*(.*?)\*/g, '<em>$1</em>');
            itemText = itemText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-blue-600 dark:text-blue-400 hover:underline" href="$2">$1</a>');
            return `<li>${itemText}</li>`;
          }
          return '';
        }).join('');
        return `<ul class="list-disc pl-5 mb-3 space-y-1">${items}</ul>`;
      }
      
      // Handle regular paragraphs
      let formatted = para.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-blue-600 dark:text-blue-400 hover:underline" href="$2">$1</a>');
      return `<p class="mb-3 leading-relaxed">${formatted}</p>`;
    }).join('');
  };

  return (
    <Card className="max-w-3xl mx-auto bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
      <div className="flex gap-2 p-3">
        {/* Upvote/Downvote Sidebar */}
        <div className="flex flex-col items-center gap-1">
          <button className="text-gray-400 hover:text-orange-500 transition-colors">
            ▲
          </button>
          <span className="text-sm font-bold text-gray-900 dark:text-white">2.4k</span>
          <button className="text-gray-400 hover:text-blue-500 transition-colors">
            ▼
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Post Metadata */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 shrink-0 overflow-hidden" />
            <span>r/marketing</span>
            <span>•</span>
            <span>Posted by u/yourbrand</span>
            <span>3 hours ago</span>
          </div>

          {/* Post Content */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: parseRedditContent(content) }} />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-3 text-gray-500 text-sm">
            <button className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span>142 Comments</span>
            </button>
            <button className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function QuoraPreview({ content }: { content: string }) {
  // Parse Quora content
  const parseQuoraContent = (text: string): string => {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map(para => {
      // Handle H2 headings
      if (para.startsWith('## ')) {
        return `<h2 class="text-base font-bold mb-2 mt-2 text-gray-900 dark:text-white">${para.substring(3)}</h2>`;
      }
      
      // Handle H3 headings
      if (para.startsWith('### ')) {
        return `<h3 class="text-sm font-semibold mb-1 mt-2 text-gray-900 dark:text-white">${para.substring(4)}</h3>`;
      }
      
      // Handle ordered lists
      if (para.match(/^\d+\.\s/m)) {
        const items = para.split('\n').filter(line => line.trim()).map(line => {
          if (line.match(/^\d+\.\s/)) {
            let itemText = line.replace(/^\d+\.\s/, '');
            itemText = itemText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
            itemText = itemText.replace(/\*(.*?)\*/g, '<em>$1</em>');
            itemText = itemText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-blue-600 dark:text-blue-400 hover:underline" href="$2">$1</a>');
            return `<li>${itemText}</li>`;
          }
          return '';
        }).join('');
        return `<ol class="list-decimal pl-5 mb-3 space-y-1">${items}</ol>`;
      }
      
      // Handle unordered lists
      if (para.match(/^[-*]\s/m)) {
        const items = para.split('\n').filter(line => line.trim()).map(line => {
          if (line.match(/^[-*]\s/)) {
            let itemText = line.substring(2);
            itemText = itemText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
            itemText = itemText.replace(/\*(.*?)\*/g, '<em>$1</em>');
            itemText = itemText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-blue-600 dark:text-blue-400 hover:underline" href="$2">$1</a>');
            return `<li>${itemText}</li>`;
          }
          return '';
        }).join('');
        return `<ul class="list-disc pl-5 mb-3 space-y-1">${items}</ul>`;
      }
      
      // Handle regular paragraphs
      let formatted = para.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-blue-600 dark:text-blue-400 hover:underline" href="$2">$1</a>');
      return `<p class="mb-3 leading-relaxed">${formatted}</p>`;
    }).join('');
  };

  return (
    <Card className="max-w-3xl mx-auto bg-white dark:bg-gray-900 p-6">
      {/* Author Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0 overflow-hidden">
          <span className="text-white font-semibold text-sm">YB</span>
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-white">Your Brand</div>
          <div className="text-sm text-gray-500">Marketing Expert • 2h ago</div>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <div dangerouslySetInnerHTML={{ __html: parseQuoraContent(content) }} />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm">
        <button className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <ThumbsUp className="w-4 h-4" />
          <span>Upvote • 234</span>
        </button>
        <button className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>
        <button className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>
    </Card>
  );
}

function NewsletterPreview({ content }: { content: string }) {
  // Parse Newsletter/Email content
  const parseNewsletterContent = (text: string): string => {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map(para => {
      // Handle H3 headings
      if (para.startsWith('### ')) {
        let heading = para.substring(4);
        heading = heading.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
        return `<h3 class="text-base font-semibold mb-2 mt-2 text-gray-900 dark:text-white">${heading}</h3>`;
      }
      
      // Handle H2 headings
      if (para.startsWith('## ')) {
        let heading = para.substring(3);
        heading = heading.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
        return `<h2 class="text-lg font-bold mb-2 mt-3 text-gray-900 dark:text-white">${heading}</h2>`;
      }
      
      // Handle ordered lists
      if (para.match(/^\d+\.\s/m)) {
        const items = para.split('\n').filter(line => line.trim()).map(line => {
          if (line.match(/^\d+\.\s/)) {
            let itemText = line.replace(/^\d+\.\s/, '');
            itemText = itemText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
            itemText = itemText.replace(/\*(.*?)\*/g, '<em>$1</em>');
            itemText = itemText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-primary hover:underline font-medium" href="$2">$1</a>');
            return `<li>${itemText}</li>`;
          }
          return '';
        }).join('');
        return `<ol class="list-decimal pl-5 mb-3 space-y-1">${items}</ol>`;
      }
      
      // Handle unordered lists
      if (para.match(/^[-*]\s/m)) {
        const items = para.split('\n').filter(line => line.trim()).map(line => {
          if (line.match(/^[-*]\s/)) {
            let itemText = line.substring(2);
            itemText = itemText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
            itemText = itemText.replace(/\*(.*?)\*/g, '<em>$1</em>');
            itemText = itemText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-primary hover:underline font-medium" href="$2">$1</a>');
            return `<li>${itemText}</li>`;
          }
          return '';
        }).join('');
        return `<ul class="list-disc pl-5 mb-3 space-y-1">${items}</ul>`;
      }
      
      // Handle regular paragraphs
      let formatted = para.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-primary hover:underline font-medium" href="$2">$1</a>');
      return `<p class="mb-3 leading-relaxed">${formatted}</p>`;
    }).join('');
  };

  return (
    <Card className="p-6">
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <div dangerouslySetInnerHTML={{ __html: parseNewsletterContent(content) }} />
      </div>
    </Card>
  );
}

function InstagramPreview({ content }: { content: string }) {
  // Get first 150 characters for preview
  const previewText = content.length > 150 ? content.substring(0, 147) + '...' : content;
  
  return (
    <Card className="max-w-md mx-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-0.5 shrink-0">
            <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold">YB</span>
            </div>
          </div>
          <span className="font-semibold text-sm text-gray-900 dark:text-white">yourbrand</span>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-900 dark:text-white" />
      </div>

      {/* Image Placeholder */}
      <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400 text-sm">Your Image Here</span>
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-900 dark:text-white cursor-pointer hover:text-gray-600">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
            </svg>
            <MessageCircle className="w-6 h-6 text-gray-900 dark:text-white cursor-pointer hover:text-gray-600" />
            <Share2 className="w-6 h-6 text-gray-900 dark:text-white cursor-pointer hover:text-gray-600" />
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-900 dark:text-white cursor-pointer hover:text-gray-600">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
          </svg>
        </div>

        {/* Likes */}
        <div className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">
          2,847 likes
        </div>

        {/* Caption */}
        <div className="text-sm text-gray-900 dark:text-white space-y-2">
          <p>
            <span className="font-bold mr-2">yourbrand</span>
            <span className="leading-relaxed">{previewText}</span>
          </p>
        </div>
        {content.length > 150 && (
          <button className="text-sm text-gray-500 dark:text-gray-400 mt-1">more</button>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 uppercase">
          2 hours ago
        </div>
      </div>
    </Card>
  );
}

function TikTokPreview({ content }: { content: string }) {
  // Get first 100 characters for caption
  const caption = content.length > 100 ? content.substring(0, 97) + '...' : content;
  
  return (
    <Card className="max-w-sm mx-auto bg-black border-gray-800 aspect-[9/16] relative overflow-hidden">
      {/* Video Background Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-pink-900 opacity-50" />
      
      {/* Content Overlay (Bottom) */}
      <div className="relative h-full flex flex-col justify-end p-4 text-white">
        <div className="mb-4">
          {/* Profile */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center bg-gray-800 shrink-0 overflow-hidden">
              <span className="text-sm font-bold">YB</span>
            </div>
            <span className="font-bold text-base">@yourbrand</span>
          </div>
          
          {/* Caption */}
          <div className="text-sm mb-2 leading-relaxed font-medium">
            {caption}
          </div>
          
          {/* Hashtags */}
          <div className="text-xs opacity-90 font-semibold">
            #fyp #viral #content
          </div>
        </div>
      </div>
      
      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-6 items-center text-white">
        {/* Like */}
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-1 cursor-pointer hover:scale-110 transition-transform">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
          </svg>
          <div className="text-xs font-semibold">12.4K</div>
        </div>
        
        {/* Comment */}
        <div className="text-center">
          <MessageCircle className="w-8 h-8 mb-1 cursor-pointer hover:scale-110 transition-transform" />
          <div className="text-xs font-semibold">342</div>
        </div>
        
        {/* Share */}
        <div className="text-center">
          <Share2 className="w-8 h-8 mb-1 cursor-pointer hover:scale-110 transition-transform" />
          <div className="text-xs font-semibold">891</div>
        </div>
      </div>
    </Card>
  );
}

function YouTubePreview({ content }: { content: string }) {
  // Extract title from first line or heading
  const lines = content.split('\n').filter(l => l.trim());
  const title = lines.find(l => l.startsWith('#'))?.replace(/^#+\s*/, '') || 
                lines.find(l => l.length > 10 && l.length < 100) || 
                'Your Video Title';
  
  // Get first 200 characters for description
  const description = content.length > 200 ? content.substring(0, 197) + '...' : content;
  
  return (
    <Card className="max-w-4xl mx-auto bg-white dark:bg-gray-900">
      {/* Video Player Area */}
      <div className="aspect-video bg-black relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900 to-gray-900 opacity-60" />
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Play Button */}
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" className="ml-1">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-medium">
          10:24
        </div>
      </div>

      {/* Video Info */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white line-clamp-2">
          {title}
        </h3>
        
        {/* Stats */}
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          24,847 views • 2 hours ago
        </div>

        {/* Channel Info */}
        <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0 overflow-hidden">
            <span className="text-white font-bold text-sm">YB</span>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-white">Your Brand</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">124K subscribers</div>
          </div>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium text-sm transition-colors">
            Subscribe
          </button>
        </div>

        {/* Engagement Buttons */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border-r border-gray-300 dark:border-gray-600">
              <ThumbsUp className="w-5 h-5 text-gray-900 dark:text-white" />
              <span className="font-medium text-sm text-gray-900 dark:text-white">2.4K</span>
            </button>
            <button className="px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 dark:text-white">
                <path d="M17 14V2"></path>
                <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
              </svg>
            </button>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <Share2 className="w-5 h-5 text-gray-900 dark:text-white" />
            <span className="font-medium text-sm text-gray-900 dark:text-white">Share</span>
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 dark:text-white">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" x2="12" y1="15" y2="3"></line>
            </svg>
            <span className="font-medium text-sm text-gray-900 dark:text-white">Download</span>
          </button>
        </div>

        {/* Description */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap line-clamp-3">
            {description}
          </div>
          <button className="text-sm font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 mt-2">
            ...more
          </button>
        </div>
      </div>
    </Card>
  );
}

function GenericPlatformPreview({ content }: { content: string }) {
  return (
    <div className="p-4 max-h-[400px] overflow-y-auto">
      <div 
        className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground"
        dangerouslySetInnerHTML={{ 
          __html: content
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-primary hover:underline" href="$2">$1</a>')
        }}
      />
    </div>
  );
}

export function PreviewPane({ generatedContent, isGenerating }: PreviewPaneProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  function getTotalCharacters() {
    return generatedContent.reduce((sum, item) => sum + item.content.length, 0);
  }

  async function handleCopy(content: string, platformId: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(platformId);
      setTimeout(() => setCopiedId(null), 2000);
      
      const platform = platforms.find(p => p.id === platformId);
      toast({
        title: "Copied!",
        description: `${platform?.name || platformId} content copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  }

  function handleDownload(content: string, platformId: string) {
    const platform = platforms.find(p => p.id === platformId);
    const platformName = platform?.name || platformId;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${platformName.toLowerCase().replace(/\s+/g, '-')}-content.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: `${platformName} content saved`,
    });
  }

  function copyAllContent() {
    const allContent = generatedContent
      .map(item => {
        const platform = platforms.find(p => p.id === item.platform);
        const platformName = platform?.name || item.platform;
        return `=== ${platformName} ===\n\n${item.content}\n\n`;
      })
      .join('\n');

    navigator.clipboard.writeText(allContent);
    toast({
      title: "All content copied!",
      description: `${generatedContent.length} platform versions copied`,
    });
  }

  if (isGenerating) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <Card className="p-12 flex flex-col items-center justify-center bg-gradient-to-br from-card to-muted/20 border-primary/20">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
            <Sparkles className="w-6 h-6 text-primary absolute -top-2 -right-2 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Generating Your Content
          </h3>
          <p className="text-muted-foreground text-center max-w-md text-lg">
            Our AI is crafting platform-optimized versions...
          </p>
          <div className="mt-6 flex gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </Card>
      </div>
    );
  }

  if (generatedContent.length === 0) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <Card className="p-12 flex flex-col items-center justify-center bg-gradient-to-br from-card to-muted/20">
          <div className="text-7xl mb-6 animate-bounce">✨</div>
          <h3 className="text-2xl font-bold mb-3">Ready to Transform</h3>
          <p className="text-muted-foreground text-center max-w-md text-lg">
            Your repurposed content will appear here. Select platforms and click Generate to start.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Header with Badge */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 mb-4 font-semibold">
          <Zap className="w-4 h-4" />
          Content Generated Successfully!
        </div>
        <h2 className="text-2xl font-bold mb-2 text-foreground">Your Platform-Optimized Content</h2>
        <p className="text-foreground/70 font-medium">Ready to copy, download, and publish</p>
      </div>

      <div className="space-y-6 animate-fade-in">
        {/* Hero Results Header */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
          <div className="relative p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Content Generated Successfully!
                  </h2>
                </div>
                <p className="text-foreground/70 text-lg font-medium">
                  Your content has been optimized for {generatedContent.length} platform{generatedContent.length > 1 ? 's' : ''}
                </p>
              </div>

              <Button onClick={copyAllContent} size="lg" className="gap-2">
                <Copy className="w-5 h-5" />
                Copy All Content
              </Button>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card/80 backdrop-blur-sm border border-border">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{generatedContent.length}</div>
                  <div className="text-sm text-foreground/60">Platforms</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-card/80 backdrop-blur-sm border border-border">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <BarChart3 className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{getTotalCharacters().toLocaleString()}</div>
                  <div className="text-sm text-foreground/60">Total Characters</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-card/80 backdrop-blur-sm border border-border">
                <div className="p-2 rounded-lg bg-accent/10">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">100%</div>
                  <div className="text-sm text-foreground/60">Optimized</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Platform Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {generatedContent.map((item) => {
            const platform = platforms.find(p => p.id === item.platform);
            const isCopied = copiedId === item.platform;
            const platformColor = platformColors[item.platform] || "bg-primary";

            return (
              <Card
                key={item.platform}
                className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
              >
                {/* Platform Header */}
                <div className={`${platformColor} p-4 text-white relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                        <div className="w-6 h-6 flex items-center justify-center text-white [&>svg]:w-6 [&>svg]:h-6">
                          {platform?.icon}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{platform?.name || item.platform}</h3>
                        <p className="text-white/90 text-sm font-medium">{item.content.length} characters</p>
                      </div>
                    </div>

                    <Badge variant="secondary" className="bg-white/30 backdrop-blur-sm text-white border border-white/40 font-semibold">
                      Ready
                    </Badge>
                  </div>
                </div>

                {/* Content Preview */}
                <div className="p-6 space-y-4">
                  {/* Character Count Indicator */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/70 font-medium">Character Count</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 via-green-500 to-primary transition-all duration-300"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <span className="font-bold text-foreground">{item.content.length}</span>
                    </div>
                  </div>

                  {/* Platform-specific Preview */}
                  <div className="border rounded-lg overflow-hidden bg-muted/30">
                    {item.platform === 'medium' && <MediumPreview content={item.content} />}
                    {item.platform === 'linkedin' && <LinkedInPreview content={item.content} />}
                    {item.platform === 'twitter' && <TwitterPreview content={item.content} />}
                    {item.platform === 'blog' && <BlogPreview content={item.content} />}
                    {item.platform === 'reddit' && <RedditPreview content={item.content} />}
                    {item.platform === 'quora' && <QuoraPreview content={item.content} />}
                    {item.platform === 'newsletter' && <NewsletterPreview content={item.content} />}
                    {item.platform === 'instagram' && <InstagramPreview content={item.content} />}
                    {item.platform === 'tiktok' && <TikTokPreview content={item.content} />}
                    {item.platform === 'youtube' && <YouTubePreview content={item.content} />}
                    {!['medium', 'linkedin', 'twitter', 'blog', 'reddit', 'quora', 'newsletter', 'instagram', 'tiktok', 'youtube'].includes(item.platform) && <GenericPlatformPreview content={item.content} />}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant={isCopied ? "default" : "outline"}
                      onClick={() => handleCopy(item.content, item.platform)}
                      className="flex-1 gap-2"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(item.content, item.platform)}
                      className="flex-1 gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>

                  {/* Engagement Metrics Simulation */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                    <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="text-lg font-bold text-primary">4.2K</div>
                      <div className="text-xs text-foreground/60">Est. Reach</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                      <div className="text-lg font-bold text-secondary">89%</div>
                      <div className="text-xs text-foreground/60">Quality</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="text-lg font-bold text-accent">High</div>
                      <div className="text-xs text-foreground/60">SEO Score</div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
