import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Sparkles, Layers, FileText } from "lucide-react";

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
      <DropdownMenuContent align="start" className="w-64">
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
            to="/free-tools/chatgpt-seo-prompts" 
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm mb-0.5">ChatGPT Prompts</div>
              <div className="text-xs text-muted-foreground">30+ ready-to-use SEO prompts</div>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

