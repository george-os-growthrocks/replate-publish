import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Loader2, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FeatureGate } from "@/components/FeatureGate";
import { useCredits } from "@/hooks/useCreditManager";

interface WheelData {
  who: string[];
  what: string[];
  when: string[];
  where: string[];
  why: string[];
  how: string[];
  are: string[];
  can: string[];
  will: string[];
  prepositions: {
    for: string[];
    with: string[];
    without: string[];
    to: string[];
    versus: string[];
    near: string[];
    like: string[];
  };
}

export function AnswerThePublicWheel() {
  const [seedKeyword, setSeedKeyword] = useState("");
  const [wheelData, setWheelData] = useState<WheelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPetal, setSelectedPetal] = useState<string | null>(null);
  const { checkCredits, consumeCredits } = useCredits();

  const handleGenerate = async () => {
    if (!seedKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    // Check credits first
    const hasCredits = await checkCredits('answer_the_public');
    if (!hasCredits) {
      return;
    }

    setIsLoading(true);
    try {
      // Use dedicated Answer The Public edge function
      const { data, error } = await supabase.functions.invoke('answer-the-public', {
        body: { keyword: seedKeyword }
      });

      if (error) throw error;

      if (!data) {
        throw new Error('No data returned from API');
      }

      // Consume credits
      await consumeCredits({
        feature: 'answer_the_public',
        metadata: { keyword: seedKeyword, total_results: data.total }
      });

      // Build wheel data structure from the API response
      const wheelData: WheelData = {
        who: data.questions?.who || [],
        what: data.questions?.what || [],
        when: data.questions?.when || [],
        where: data.questions?.where || [],
        why: data.questions?.why || [],
        how: data.questions?.how || [],
        are: data.questions?.are || [],
        can: data.questions?.can || [],
        will: data.questions?.will || [],
        prepositions: {
          for: data.prepositions?.for || [],
          with: data.prepositions?.with || [],
          without: data.prepositions?.without || [],
          to: data.prepositions?.to || [],
          versus: data.prepositions?.versus || [],
          near: data.prepositions?.near || [],
          like: data.prepositions?.like || [],
        },
      };

      setWheelData(wheelData);
      
      if (data.cached) {
        toast.success("Wheel generated from cache!");
      } else {
        toast.success(`Wheel generated with ${data.total} questions!`);
      }
    } catch (error) {
      console.error("Wheel generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate wheel");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!wheelData) return;

    const rows: string[] = ['Category,Question'];
    
    Object.entries(wheelData).forEach(([category, questions]) => {
      if (Array.isArray(questions)) {
        questions.forEach(q => rows.push(`"${category}","${q}"`));
      } else if (typeof questions === 'object') {
        Object.entries(questions).forEach(([subCat, subQuestions]) => {
          (subQuestions as string[]).forEach(q => rows.push(`"${category}_${subCat}","${q}"`));
        });
      }
    });

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `answer-the-public-${seedKeyword.replace(/\s+/g, '-')}.csv`;
    a.click();
    toast.success("CSV exported!");
  };

  const questionCategories = wheelData ? [
    { key: 'who', label: 'Who', color: 'bg-blue-500', items: wheelData.who },
    { key: 'what', label: 'What', color: 'bg-purple-500', items: wheelData.what },
    { key: 'when', label: 'When', color: 'bg-green-500', items: wheelData.when },
    { key: 'where', label: 'Where', color: 'bg-amber-500', items: wheelData.where },
    { key: 'why', label: 'Why', color: 'bg-red-500', items: wheelData.why },
    { key: 'how', label: 'How', color: 'bg-cyan-500', items: wheelData.how },
  ] : [];

  const totalQuestions = wheelData 
    ? Object.values(wheelData).flat(2).filter(Boolean).length 
    : 0;

  return (
    <FeatureGate feature="answer_the_public" featureKey="answer_the_public_unlimited">
      <div className="space-y-6">
        {/* Input */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Answer The Public Wheel
          </CardTitle>
          <CardDescription>
            Generate a visual wheel of questions people ask about your keyword
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter seed keyword..."
              value={seedKeyword}
              onChange={(e) => setSeedKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              className="flex-1"
            />
            <Button onClick={handleGenerate} disabled={isLoading} className="gradient-primary min-w-[140px]">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Search className="w-4 h-4 mr-2" /> Generate Wheel</>
              )}
            </Button>
            {wheelData && (
              <Button onClick={handleExportCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {wheelData && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{totalQuestions}</div>
              <p className="text-sm text-muted-foreground">Total Questions</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-500">{wheelData.what.length}</div>
              <p className="text-sm text-muted-foreground">What Questions</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-green-500">{wheelData.how.length}</div>
              <p className="text-sm text-muted-foreground">How Questions</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-500">{wheelData.why.length}</div>
              <p className="text-sm text-muted-foreground">Why Questions</p>
            </Card>
          </div>

          {/* Visual Wheel (Simplified Grid Layout) */}
          <Card>
            <CardHeader>
              <CardTitle>Question Wheel</CardTitle>
              <CardDescription>Click a category to see all questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {questionCategories.map((category) => (
                  <Card 
                    key={category.key}
                    className={`cursor-pointer hover:shadow-lg transition-all ${
                      selectedPetal === category.key ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedPetal(category.key)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-3 h-3 rounded-full ${category.color}`} />
                        <h3 className="font-semibold">{category.label}</h3>
                        <Badge variant="secondary" className="ml-auto">
                          {category.items.length}
                        </Badge>
                      </div>
                      {selectedPetal === category.key && category.items.length > 0 && (
                        <div className="space-y-1 mt-3 max-h-60 overflow-y-auto">
                          {category.items.slice(0, 10).map((item, idx) => (
                            <div key={idx} className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                              {item}
                            </div>
                          ))}
                          {category.items.length > 10 && (
                            <p className="text-xs text-muted-foreground text-center pt-2">
                              +{category.items.length - 10} more
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
    </FeatureGate>
  );
}

