import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, X, Send, Loader2, Sparkles, TrendingUp, Link2, Search, Download, Maximize2, Minimize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickPrompts = [
  {
    icon: Search,
    emoji: "🔍",
    text: "Analyze a keyword",
    prompt: "Can you analyze the keyword 'seo tools' for me? Show me search volume, difficulty, and opportunities."
  },
  {
    icon: TrendingUp,
    emoji: "📊",
    text: "Show my GSC data",
    prompt: "Show me my Google Search Console performance data and suggest quick wins."
  },
  {
    icon: Link2,
    emoji: "🎯",
    text: "Find quick wins",
    prompt: "What are my quick win opportunities? Show me keywords where I'm on page 2."
  },
  {
    icon: Sparkles,
    emoji: "🔥",
    text: "Competitor analysis",
    prompt: "Analyze my top competitors and show me how to beat them."
  }
];

export function SEOAIChatbot() {
  const [user, setUser] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hi! I'm **AnotherSEOGuru AI**, your intelligent SEO assistant trained on your complete site data and industry insights.\n\n**I can help you with:**\n\n• Keyword Research & Clustering  \n• SERP Tracking & Analysis  \n• Backlink Strategies  \n• Content Optimization  \n• Technical SEO Audits  \n• Google Search Console Data  \n• Site Audits & Technical Analysis  \n• Competitor Intelligence  \n• Content Gap Analysis  \n• Real-time data analysis from DataForSEO & GSC\n\n**Interactive Features:**\n\n🔍 Just ask me to analyze a keyword and I'll fetch live data!  \n📊 I can pull your GSC metrics and suggest improvements  \n🎯 Want competitor analysis? I'll get real SERP data  \n💡 Need content ideas? I'll analyze gaps and opportunities\n\n**Click a quick prompt below or ask me anything!**",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get authenticated user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load selected property from localStorage on mount
  useEffect(() => {
    const savedProperty = localStorage.getItem('anotherseo_selected_property');
    if (savedProperty) {
      setSelectedProperty(savedProperty);
      console.log('📍 Loaded saved property:', savedProperty);
    }
  }, []);

  // Listen for property changes from FilterContext
  useEffect(() => {
    const handleStorageChange = () => {
      const property = localStorage.getItem('anotherseo_filter_property');
      if (property && property !== selectedProperty) {
        setSelectedProperty(property);
        localStorage.setItem('anotherseo_selected_property', property);
        console.log('📍 Property changed to:', property);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also check immediately
    handleStorageChange();

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [selectedProperty]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: textToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setShowQuickPrompts(false);

    try {
      let projectContext = null;
      if (user) {
        // Fetch COMPREHENSIVE user data
        try {
          console.log('🔍 Fetching comprehensive context for', selectedProperty || 'all properties');
          
          // 1. Get user's properties
          const { data: properties } = await supabase
            .from("gsc_properties")
            .select("property_url")
            .eq("user_id", user.id)
            .limit(10);

          // 2. Get tracked keywords with full details
          const keywordsQuery = supabase
            .from("tracked_keywords")
            .select("keyword, current_position, search_volume, previous_position, last_checked_at")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("search_volume", { ascending: false })
            .limit(50);

          // Filter by property if one is selected
          if (selectedProperty) {
            keywordsQuery.eq("property_url", selectedProperty);
          }

          const { data: trackedKeywords } = await keywordsQuery;

          // 3. Get recent GSC queries if property is selected
          let gscQueries = null;
          if (selectedProperty) {
            const { data: gscData } = await supabase.functions.invoke("gsc-query", {
              body: {
                propertyUrl: selectedProperty,
                startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                dimensions: ['query'],
                rowLimit: 100
              }
            });
            gscQueries = gscData?.queries?.slice(0, 20) || null;
          }

          // 4. Get recent algorithm impacts
          const { data: algorithmImpacts } = await supabase
            .from("algorithm_impacts")
            .select("update_name, impact_severity, affected_keywords_count, detected_at")
            .eq("user_id", user.id)
            .order("detected_at", { ascending: false })
            .limit(5);

          projectContext = {
            selected_property: selectedProperty,
            properties: properties?.map(p => p.property_url) || [],
            tracked_keywords: trackedKeywords || [],
            gsc_queries: gscQueries,
            algorithm_impacts: algorithmImpacts || [],
            context_timestamp: new Date().toISOString()
          };

          console.log('✅ Context loaded:', {
            property: selectedProperty,
            keywords: trackedKeywords?.length || 0,
            queries: gscQueries?.length || 0,
            impacts: algorithmImpacts?.length || 0
          });
        } catch (contextError) {
          console.error("Failed to fetch user context:", contextError);
          projectContext = {
            selected_property: selectedProperty,
            properties: [],
            tracked_keywords: [],
            gsc_queries: null,
            algorithm_impacts: []
          };
        }
      }

      const { data, error } = await supabase.functions.invoke("seo-ai-chat", {
        body: {
          messages: newMessages,
          projectContext,
          sessionId,
          userId: user?.id,
        },
      });

      console.log("📥 Edge function response:", { data, error });

      if (error) {
        console.error("❌ Edge function error:", error);
        throw new Error(error.message || "Failed to get response from AI");
      }

      if (!data?.message) {
        console.error("❌ No message in response:", data);
        throw new Error("AI returned an empty response. Please try again.");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
      };

      console.log("✅ Adding assistant message to chat");
      setMessages((prev) => [...prev, assistantMessage]);

      if (user) {
        // Store conversation snapshot
        await supabase.from("chatbot_conversations").insert({
          user_id: user.id,
          project_id: null,
          messages: [...newMessages, assistantMessage],
        });
      }
    } catch (error) {
      console.error("💥 Chat error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to get response";
      
      toast({
        title: "AI Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Add error message to chat for better UX
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **Error:** ${errorMessage}\n\n**Troubleshooting:**\n\n• Try rephrasing your question\n• Check browser console (F12) for details\n• Refresh the page if issue persists\n\nIf you continue to see this error, there may be an issue with the AI service. Please try again in a moment.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const exportConversation = () => {
    const exportData = {
      session_id: sessionId,
      exported_at: new Date().toISOString(),
      messages,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seo-ai-chat-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Conversation Exported",
      description: "Your chat history has been downloaded",
    });
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-[0_0_40px_hsl(262_83%_58%/0.5)] hover:shadow-[0_0_50px_hsl(262_83%_58%/0.7)] z-[9999] transition-all hover:scale-110 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          size="icon"
        >
          <div className="relative">
            <MessageSquare className="w-7 h-7 text-white" />
            <Sparkles className="w-4 h-4 absolute -top-2 -right-2 text-yellow-300 animate-pulse" />
          </div>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={`fixed ${isFullscreen ? 'inset-2 sm:inset-4' : 'bottom-6 right-6 w-[calc(100vw-3rem)] h-[calc(100vh-3rem)] sm:w-[420px] sm:h-[650px]'} flex flex-col shadow-[0_0_50px_hsl(262_83%_58%/0.4)] z-[9999] border-primary/30 overflow-hidden transition-all duration-300 bg-background`}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-xs sm:text-sm truncate">AnotherSEOGuru AI</h3>
              <p className="text-xs truncate">
                {selectedProperty ? (
                  <span className="text-primary font-semibold">📍 {selectedProperty}</span>
                ) : (
                  <span className="opacity-70">Your Intelligent SEO Assistant</span>
                )}
              </p>
            </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={exportConversation}
                className="text-primary-foreground hover:bg-white/20 h-7 w-7 sm:h-8 sm:w-8"
                title="Export conversation"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-primary-foreground hover:bg-white/20 h-7 w-7 sm:h-8 sm:w-8 hidden sm:flex"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-white/20 h-7 w-7 sm:h-8 sm:w-8"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3 sm:p-4 bg-gradient-to-b from-background to-muted/20" ref={scrollRef}>
            <div className="space-y-3 sm:space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[95%] sm:max-w-[90%] md:max-w-[85%] rounded-2xl p-3 sm:p-4 shadow-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                        : "bg-card border text-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="text-xs sm:text-sm prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border rounded-2xl p-3 sm:p-4 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-primary" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}

              {/* Quick Prompts */}
              {showQuickPrompts && messages.length === 1 && (
                <div className="space-y-2 mt-3 sm:mt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2 sm:mb-3">Quick Start:</p>
                  {quickPrompts.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={idx}
                        variant="outline"
                        className="w-full justify-start h-auto py-2 sm:py-3 px-3 sm:px-4 hover:bg-primary/5 hover:border-primary/50 transition-all text-xs sm:text-sm"
                        onClick={() => handleQuickPrompt(item.prompt)}
                      >
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-primary shrink-0" />
                        <span className="text-left truncate">{item.text}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 sm:p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about keywords, backlinks, SEO..."
                disabled={isLoading}
                className="flex-1 text-sm sm:text-base"
              />
              <Button 
                onClick={() => sendMessage()} 
                disabled={isLoading || !input.trim()} 
                size="icon"
                className="shrink-0 h-9 w-9 sm:h-10 sm:w-10"
              >
                <Send className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Powered by AnotherSEOGuru AI • Trained on your SEO data
            </p>
          </div>
        </Card>
      )}
    </>
  );
}

