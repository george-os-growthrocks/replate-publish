import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, AlignLeft, List, Hash, Clock, BarChart3, TrendingUp } from "lucide-react";
import { useMemo } from "react";

interface ContentReviewProps {
  content: string;
}

export function ContentReview({ content }: ContentReviewProps) {
  const stats = useMemo(() => {
    if (!content.trim()) {
      return {
        words: 0,
        characters: 0,
        paragraphs: 0,
        sentences: 0,
        readingTime: 0,
      };
    }

    const words = content.trim().split(/\s+/).length;
    const characters = content.length;
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim()).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim()).length;
    const readingTime = Math.ceil(words / 200); // Average reading speed: 200 words/min

    return { words, characters, paragraphs, sentences, readingTime };
  }, [content]);

  const quality = useMemo(() => {
    const { words, paragraphs, sentences } = stats;
    
    if (words === 0) return { score: 0, label: 'No content', color: 'text-muted-foreground', bgColor: 'bg-muted/30' };
    
    let score = 0;
    
    // Word count scoring
    if (words >= 300) score += 25;
    else if (words >= 150) score += 15;
    else if (words >= 100) score += 5;
    
    // Structure scoring
    if (paragraphs >= 3) score += 25;
    else if (paragraphs >= 2) score += 15;
    
    // Sentence variety
    const avgSentenceLength = words / sentences;
    if (avgSentenceLength >= 10 && avgSentenceLength <= 20) score += 25;
    else if (avgSentenceLength >= 8 && avgSentenceLength <= 25) score += 15;
    
    // Engagement potential
    const hasQuestions = content.includes('?');
    const hasEmphasis = content.includes('!');
    if (hasQuestions) score += 12;
    if (hasEmphasis) score += 13;
    
    if (score >= 80) return { score, label: 'Excellent', color: 'text-green-500', bgColor: 'bg-green-500/10' };
    if (score >= 60) return { score, label: 'Good', color: 'text-blue-500', bgColor: 'bg-blue-500/10' };
    if (score >= 40) return { score, label: 'Fair', color: 'text-amber-500', bgColor: 'bg-amber-500/10' };
    return { score, label: 'Needs Work', color: 'text-destructive', bgColor: 'bg-destructive/10' };
  }, [content, stats]);

  return (
    <Card className="p-6 shadow-strong">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Content Analysis</h3>
      </div>
      
      <div className="space-y-4">
        {/* Quality Score - Enhanced */}
        <div className={`relative overflow-hidden rounded-lg border ${quality.bgColor} border-${quality.color.split('-')[1]}/20`}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className={`w-6 h-6 ${quality.color}`} />
                <div>
                  <div className="text-sm text-muted-foreground">Quality Score</div>
                  <div className={`text-3xl font-bold ${quality.color}`}>
                    {quality.score}%
                  </div>
                </div>
              </div>
              <Badge 
                variant={quality.score >= 60 ? "default" : "secondary"}
                className="text-sm px-3 py-1"
              >
                {quality.label}
              </Badge>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="h-1 bg-muted">
            <div 
              className={`h-full transition-all duration-500 ${quality.color.replace('text-', 'bg-')}`}
              style={{ width: `${quality.score}%` }}
            />
          </div>
        </div>

        {/* Statistics Grid - Enhanced */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Words</div>
              <div className="text-lg font-bold">{stats.words.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-lg border border-secondary/20">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Hash className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Characters</div>
              <div className="text-lg font-bold">{stats.characters.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-accent/5 to-accent/10 rounded-lg border border-accent/20">
            <div className="p-2 rounded-lg bg-accent/10">
              <AlignLeft className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Paragraphs</div>
              <div className="text-lg font-bold">{stats.paragraphs}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <div className="p-2 rounded-lg bg-primary/10">
              <List className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Sentences</div>
              <div className="text-lg font-bold">{stats.sentences}</div>
            </div>
          </div>
        </div>

        {/* Reading Time - Enhanced */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background/50">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium">Estimated Reading Time</span>
          </div>
          <span className="text-lg font-bold text-primary">{stats.readingTime} min</span>
        </div>

        {/* Recommendations - Enhanced */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <div className="w-1 h-4 bg-primary rounded-full" />
            Quick Recommendations
          </h4>
          <ul className="space-y-2">
            {stats.words < 300 && (
              <li className="flex items-start gap-2 text-sm">
                <span className="text-amber-500 mt-0.5">⚠</span>
                <span className="text-muted-foreground">Consider adding more content (target: 300+ words for better engagement)</span>
              </li>
            )}
            {stats.paragraphs < 3 && (
              <li className="flex items-start gap-2 text-sm">
                <span className="text-amber-500 mt-0.5">⚠</span>
                <span className="text-muted-foreground">Break content into more paragraphs for improved readability</span>
              </li>
            )}
            {!content.includes('?') && (
              <li className="flex items-start gap-2 text-sm">
                <span className="text-blue-500 mt-0.5">💡</span>
                <span className="text-muted-foreground">Add questions to boost user engagement and interaction</span>
              </li>
            )}
            {stats.words >= 300 && stats.paragraphs >= 3 && (
              <li className="flex items-start gap-2 text-sm">
                <span className="text-green-500 mt-0.5">✓</span>
                <span className="text-green-600 dark:text-green-500 font-medium">Excellent structure and length! Content is well-optimized.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </Card>
  );
}

