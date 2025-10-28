import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Sparkles, Layers, FileText, FileCode, Heading, Bot, Code2, BarChart3 } from "lucide-react";

export function FreeToolsDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3"
        >
          Free Tools
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <div className="px-2 py-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Analysis Tools
          </p>
        </div>
        
        <DropdownMenuItem asChild>
          <Link 
            to="/free-tools/ai-overview-checker" 
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm mb-0.5">AI Overview Checker</div>
              <div className="text-xs text-muted-foreground">Check if keywords have AI Overviews</div>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link 
            to="/free-tools/heading-analyzer" 
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <Heading className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm mb-0.5">Heading Analyzer</div>
              <div className="text-xs text-muted-foreground">Analyze H1-H6 tags for SEO</div>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link 
            to="/free-tools/keyword-clustering" 
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <Layers className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm mb-0.5">Keyword Clustering</div>
              <div className="text-xs text-muted-foreground">Group keywords by topic (100 free)</div>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link 
            to="/free-tools/keyword-density-checker" 
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <BarChart3 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm mb-0.5">Keyword Density Checker</div>
              <div className="text-xs text-muted-foreground">Analyze keyword usage in content</div>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Generators
          </p>
        </div>

        <DropdownMenuItem asChild>
          <Link 
            to="/free-tools/meta-tags-generator" 
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm mb-0.5">Meta Tags Generator</div>
              <div className="text-xs text-muted-foreground">Create perfect meta tags for SEO</div>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link 
            to="/free-tools/robots-txt-generator" 
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <FileCode className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm mb-0.5">Robots.txt Generator</div>
              <div className="text-xs text-muted-foreground">Create robots.txt file instantly</div>
            </div>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link 
            to="/free-tools/schema-generator" 
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <Code2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm mb-0.5">Schema Markup Generator</div>
              <div className="text-xs text-muted-foreground">JSON-LD structured data for SEO</div>
            </div>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link 
            to="/free-tools/chatgpt-seo-prompts" 
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <Bot className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm mb-0.5">ChatGPT SEO Prompts</div>
              <div className="text-xs text-muted-foreground">30+ ready-to-use SEO prompts</div>
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
