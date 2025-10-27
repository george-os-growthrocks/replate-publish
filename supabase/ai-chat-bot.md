SEO AI CHATBOT - COMPLETE IMPLEMENTATION GUIDE
📋 TABLE OF CONTENTS
Overview & Architecture
Database Schema
Backend Logic (Edge Function)
Frontend Component
Design System & Styling
Data Flow & Process
Features & Capabilities
Integration Points
1. OVERVIEW & ARCHITECTURE {#overview}
What It Is
A floating AI chatbot that provides intelligent SEO assistance, trained on your platform's features with access to user's project data for personalized recommendations.

Technology Stack
AI Model: Google Gemini 2.5 Flash (via Lovable AI Gateway)
Backend: Supabase Edge Function (seo-ai-chat)
Frontend: React component with TypeScript
Database: PostgreSQL with RLS policies
UI Library: shadcn/ui components
Key Architecture Decisions
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   User UI   │─────▶│  Edge Function   │─────▶│  Lovable AI     │
│ (Frontend)  │      │  seo-ai-chat     │      │  (Gemini Flash) │
└─────────────┘      └──────────────────┘      └─────────────────┘
       │                      │
       │                      ▼
       │             ┌──────────────────┐
       └────────────▶│    Database      │
                     │  (Conversations  │
                     │   & Context)     │
                     └──────────────────┘
2. DATABASE SCHEMA {#database}
Table: chatbot_conversations

CREATE TABLE public.chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES seo_projects(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
Fields Explained
Field	Type	Purpose
id	UUID	Primary key, auto-generated
user_id	UUID	Links to authenticated user (required)
project_id	UUID	Links to specific SEO project (optional)
messages	JSONB	Stores conversation history as array
created_at	Timestamp	When conversation started
updated_at	Timestamp	Last message timestamp
RLS Policies

-- Users can only manage their own conversations
CREATE POLICY "Users can manage their own chatbot conversations"
ON chatbot_conversations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
Indexes

CREATE INDEX idx_chatbot_conversations_user_id 
  ON chatbot_conversations(user_id);
CREATE INDEX idx_chatbot_conversations_session_id 
  ON chatbot_conversations(session_id);
TypeScript Types

// From src/integrations/supabase/types.ts
chatbot_conversations: {
  Row: {
    id: string;
    user_id: string;
    project_id: string | null;
    messages: Json; // Array of {role: "user"|"assistant", content: string}
    created_at: string;
    updated_at: string;
  }
  Insert: {
    user_id: string;
    project_id?: string | null;
    messages?: Json;
    // Other fields optional with defaults
  }
}
3. BACKEND LOGIC (EDGE FUNCTION) {#backend}
File: supabase/functions/seo-ai-chat/index.ts
Core Function Flow

Deno.serve(async (req) => {
  // 1. CORS handling
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 2. Parse request
  const { messages, projectContext, sessionId, userId } = await req.json();

  // 3. Get API key
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  // 4. Build contextual prompt
  let contextualPrompt = buildContextPrompt(projectContext);

  // 5. Prepare system prompt
  const systemPrompt = baseSystemPrompt + contextualPrompt;

  // 6. Call Lovable AI
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    }),
  });

  // 7. Handle errors
  if (response.status === 429) return rateLimitError();
  if (response.status === 402) return paymentRequiredError();

  // 8. Return AI response
  const data = await response.json();
  return new Response(
    JSON.stringify({ message: data.choices[0].message.content }),
    { headers: corsHeaders }
  );
});
Context Building Logic

// Lines 20-39 of the edge function
function buildContextPrompt(projectContext) {
  if (!projectContext?.projects?.length) return "";
  
  let prompt = "\n\n**USER'S CURRENT DATA:**\n";
  
  // Add active projects
  prompt += `- Active Projects: ${projectContext.projects
    .map(p => p.domain)
    .join(", ")}\n`;
  
  // Add recent keywords with metrics
  if (projectContext.recent_keywords?.length) {
    prompt += `- Recent Keywords: ${projectContext.recent_keywords
      .slice(0, 10)
      .map(k => `${k.keyword} (vol: ${k.search_volume || 'N/A'}, diff: ${k.difficulty || 'N/A'})`)
      .join(", ")}\n`;
  }
  
  // Add pending recommendations
  if (projectContext.pending_recommendations?.length) {
    prompt += `- Pending AI Recommendations: ${projectContext.pending_recommendations.length} items\n`;
    prompt += `  Top recommendations: ${projectContext.pending_recommendations
      .slice(0, 3)
      .map(r => r.title)
      .join("; ")}\n`;
  }
  
  prompt += "\nWhen answering, reference the user's actual data when relevant.";
  return prompt;
}
System Prompt (Lines 41-83)
The AI is trained with comprehensive knowledge about:

Core SEO Features:

✅ Keyword Research (9 billion keywords database)
✅ Keyword Clustering (unlimited SERP/Semantic)
✅ SERP Similarity Tool
✅ Keyword Tracking (unlimited)
✅ Backlink Analysis & Gap Analysis
✅ Traffic Analytics
✅ Rank Tracking (Google & GMB)
✅ Content Gap Analysis
✅ AI Content Writer
✅ NLP Text Analysis
✅ Site Audit & Technical SEO
✅ Google Search Console Integration
✅ Google Analytics Integration
✅ White-Labeled Reports
✅ Bulk Operations
Platform Benefits:

Pay-as-you-go pricing model
Enterprise features at affordable prices
Real-time DataForSEO integration
Unlimited tracking without per-keyword fees
Privacy-focused processing
Error Handling

// Rate limiting (429)
if (response.status === 429) {
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
    { status: 429, headers: corsHeaders }
  );
}

// Payment required (402)
if (response.status === 402) {
  return new Response(
    JSON.stringify({ error: "AI service unavailable. Please contact support." }),
    { status: 402, headers: corsHeaders }
  );
}
4. FRONTEND COMPONENT {#frontend}
File: src/components/SEOAIChatbot.tsx
Component Structure

export const SEOAIChatbot = () => {
  // State Management
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [messages, setMessages] = useState<Message[]>([initialWelcomeMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  
  // Hooks
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Core functions
  return (
    <>
      {/* Floating Button */}
      {/* Chat Window */}
    </>
  );
};
Key Functions
sendMessage() - Lines 64-146

const sendMessage = async (messageText?: string) => {
  const textToSend = messageText || input;
  if (!textToSend.trim() || isLoading) return;

  // 1. Add user message to UI
  const userMessage: Message = { role: "user", content: textToSend };
  const newMessages = [...messages, userMessage];
  setMessages(newMessages);
  setInput("");
  setIsLoading(true);
  setShowQuickPrompts(false);

  try {
    // 2. Fetch user's project context
    let projectContext = null;
    if (user) {
      // Get user's projects
      const { data: projects } = await supabase
        .from("seo_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (projects?.length) {
        // Get recent keywords
        const projectIds = projects.map(p => p.id);
        const { data: keywords } = await supabase
          .from("keyword_analysis")
          .select("keyword, search_volume, difficulty")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
          .limit(20);

        // Build context object
        projectContext = {
          projects: projects.map(p => ({
            domain: p.domain,
            name: p.name,
            created_at: p.created_at,
          })),
          recent_keywords: keywords || [],
          pending_recommendations: [], // Temporarily disabled
        };
      }
    }

    // 3. Call edge function
    const { data, error } = await supabase.functions.invoke("seo-ai-chat", {
      body: {
        messages: newMessages,
        projectContext,
        sessionId,
        userId: user?.id,
      },
    });

    if (error) throw error;

    // 4. Add assistant response to UI
    const assistantMessage: Message = {
      role: "assistant",
      content: data.message || "I apologize, but I couldn't generate a response.",
    };
    setMessages(prev => [...prev, assistantMessage]);

    // 5. Store conversation in database
    if (user) {
      await supabase.from("chatbot_conversations").insert({
        user_id: user.id,
        project_id: null,
        messages: [...newMessages, assistantMessage],
      });
    }
  } catch (error) {
    console.error("Chat error:", error);
    toast({
      title: "Error",
      description: "Failed to get response. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};
Quick Prompts - Lines 18-39

const quickPrompts = [
  {
    icon: Search,
    text: "How do I do keyword research?",
    prompt: "Explain how to do effective keyword research using AnotherSEOGuru's keyword database and clustering tools."
  },
  {
    icon: TrendingUp,
    text: "Best practices for SERP tracking",
    prompt: "What are the best practices for tracking SERP rankings and monitoring competitors?"
  },
  {
    icon: Link2,
    text: "Backlink building strategies",
    prompt: "Share effective backlink building strategies and how to use the backlink analysis tools."
  },
  {
    icon: Sparkles,
    text: "Content optimization tips",
    prompt: "Give me tips on optimizing content for SEO using AI and NLP analysis."
  }
];
Export Conversation - Lines 159-180

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
5. DESIGN SYSTEM & STYLING {#design}
Floating Button Design

<Button
  className="fixed bottom-6 right-6 h-16 w-16 rounded-full 
    shadow-[0_0_40px_hsl(262_83%_58%/0.5)] 
    hover:shadow-[0_0_50px_hsl(262_83%_58%/0.7)] 
    z-[9999] 
    transition-all hover:scale-110 
    bg-gradient-to-r from-primary to-secondary 
    hover:from-primary/90 hover:to-secondary/90"
>
  <MessageSquare className="w-7 h-7 text-white" />
  <Sparkles className="w-4 h-4 absolute -top-2 -right-2 text-yellow-300 animate-pulse" />
</Button>
Design Elements:

Position: Fixed bottom-right (6 units from edges)
Size: 16x16 (64px x 64px)
Shadow: Glowing purple effect using primary color
Gradient: Primary to secondary color
Animation: Scale on hover (110%), pulse on sparkles icon
z-index: 9999 (above all content)
Chat Window Design

<Card className={`
  fixed 
  ${isFullscreen 
    ? 'inset-2 sm:inset-4' 
    : 'bottom-6 right-6 w-[calc(100vw-3rem)] h-[calc(100vh-3rem)] sm:w-[420px] sm:h-[650px]'
  } 
  flex flex-col 
  shadow-[0_0_50px_hsl(262_83%_58%/0.4)] 
  z-[9999] 
  border-primary/30 
  overflow-hidden 
  transition-all duration-300 
  bg-background
`}>
Dimensions:

Mobile: Full screen minus 3rem margins
Desktop: 420px width x 650px height
Fullscreen: 2-4 units inset from viewport edges
Shadow: Stronger glow than button
Border: Primary color at 30% opacity
Transitions: 300ms smooth transitions
Header Design

<div className="flex items-center justify-between p-3 sm:p-4 border-b 
  bg-gradient-to-r from-primary via-primary to-secondary 
  text-primary-foreground">
  {/* Online indicator */}
  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 
    bg-green-400 rounded-full animate-pulse" />
  <h3 className="font-bold text-xs sm:text-sm">Super SEO AI Assistant</h3>
  <p className="text-xs opacity-90">With project data access</p>
</div>
Colors:

Background: Gradient from primary → primary → secondary
Text: Primary foreground (white)
Status Indicator: Green-400 with pulse animation
Border: Bottom border separating header from content
Message Bubbles
User Messages:


<div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] 
  rounded-2xl p-3 sm:p-4 shadow-sm 
  bg-gradient-to-r from-primary to-secondary 
  text-primary-foreground">
  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
    {msg.content}
  </p>
</div>
Assistant Messages:


<div className="max-w-[95%] sm:max-w-[90%] md:max-w-[85%] 
  rounded-2xl p-3 sm:p-4 shadow-sm 
  bg-card border text-foreground">
  <ReactMarkdown className="text-xs sm:text-sm prose prose-sm dark:prose-invert">
    {msg.content}
  </ReactMarkdown>
</div>
Design Specs:

Max Width: 85-95% of container (responsive)
Border Radius: 2xl (rounded-2xl = 1rem)
Padding: 3-4 units (responsive)
Typography: xs to sm (responsive)
Markdown Support: Only for assistant messages
Quick Prompt Buttons

<Button
  variant="outline"
  className="w-full justify-start h-auto py-2 sm:py-3 px-3 sm:px-4 
    hover:bg-primary/5 hover:border-primary/50 
    transition-all text-xs sm:text-sm">
  <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-primary shrink-0" />
  <span className="text-left truncate">{item.text}</span>
</Button>
Colors:

Default: Outline variant (border only)
Hover Background: Primary at 5% opacity
Hover Border: Primary at 50% opacity
Icon: Primary color
Text: Left-aligned, truncated if too long
Input Area Design

<div className="p-3 sm:p-4 border-t bg-background">
  <div className="flex gap-2">
    <Input
      placeholder="Ask about keywords, backlinks, SEO..."
      className="flex-1 text-sm sm:text-base"
    />
    <Button size="icon" className="shrink-0 h-9 w-9 sm:h-10 sm:w-10">
      <Send className="w-3 h-3 sm:w-4 sm:h-4" />
    </Button>
  </div>
  <p className="text-xs text-muted-foreground mt-2 text-center">
    Powered by AI • Trained on AnotherSEOGuru platform
  </p>
</div>
Color Reference from Design System
Based on your platform's color system:


/* Primary Color (Purple) */
--primary: 262 83% 58%  /* hsl(262, 83%, 58%) - #9b87f5 */

/* Secondary Color (Pink) */
--secondary: 280 89% 60%  /* hsl(280, 89%, 60%) */

/* Gradients Used */
.bg-gradient-to-r.from-primary.to-secondary {
  background: linear-gradient(to right, hsl(262, 83%, 58%), hsl(280, 89%, 60%));
}

/* Shadows */
.shadow-glow-primary {
  box-shadow: 0 0 40px hsl(262 83% 58% / 0.5);
}

/* Card Background */
--card: 0 0% 100%  /* Light mode: white */
--card: 240 10% 3.9%  /* Dark mode: very dark gray */
Responsive Breakpoints

/* Mobile First */
.text-xs     /* 12px */
.p-3         /* 12px padding */
.w-3 .h-3    /* 12px icons */

/* Small screens and up (640px+) */
sm:text-sm   /* 14px */
sm:p-4       /* 16px padding */
sm:w-4 sm:h-4  /* 16px icons */

/* Medium screens (768px+) */
md:max-w-[85%]  /* 85% max width for messages */
6. DATA FLOW & PROCESS {#flow}
Complete User Journey

graph TD
    A[User Opens Chat] --> B{Is Authenticated?}
    B -->|Yes| C[Fetch User Context]
    B -->|No| D[Show Chat Without Context]
    
    C --> E[Load Projects from DB]
    E --> F[Load Keywords from DB]
    F --> G[Load Recommendations]
    
    G --> H[User Sends Message]
    D --> H
    
    H --> I[Build Context Object]
    I --> J[Call Edge Function]
    J --> K[Edge Function Gets Context]
    K --> L[Build System Prompt]
    L --> M[Call Lovable AI API]
    M --> N[Gemini Processes Request]
    
    N --> O{Success?}
    O -->|Yes| P[Return AI Response]
    O -->|No 429| Q[Rate Limit Error]
    O -->|No 402| R[Payment Required]
    O -->|Other| S[Generic Error]
    
    P --> T[Display in Chat]
    T --> U[Store in Database]
    U --> V[Conversation Complete]
    
    Q --> W[Show Toast Error]
    R --> W
    S --> W
Detailed Message Flow
Step 1: User Input

// User types message and presses Enter or clicks Send
handleKeyPress(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}
Step 2: Context Collection

// Fetch last 5 projects
const { data: projects } = await supabase
  .from("seo_projects")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(5);

// Fetch last 20 keywords from those projects
const projectIds = projects.map(p => p.id);
const { data: keywords } = await supabase
  .from("keyword_analysis")
  .select("keyword, search_volume, difficulty")
  .in("project_id", projectIds)
  .order("created_at", { ascending: false })
  .limit(20);
Step 3: Edge Function Call

const { data, error } = await supabase.functions.invoke("seo-ai-chat", {
  body: {
    messages: [
      { role: "user", content: "How do I do keyword research?" },
      // Previous messages included for context
    ],
    projectContext: {
      projects: [...],
      recent_keywords: [...],
      pending_recommendations: [...]
    },
    sessionId: "session-1234567890",
    userId: "uuid-here"
  },
});
Step 4: AI Processing

// Edge function builds enhanced prompt
const systemPrompt = basePrompt + `
**USER'S CURRENT DATA:**
- Active Projects: example.com, test.com
- Recent Keywords: seo tools (vol: 5400, diff: 45), ...
`;

// Calls Lovable AI
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "How do I do keyword research?" }
    ],
  }),
});
Step 5: Response Display

// Add AI response to messages
setMessages(prev => [...prev, {
  role: "assistant",
  content: "To do keyword research effectively, start by..."
}]);

// Store in database for history
await supabase.from("chatbot_conversations").insert({
  user_id: user.id,
  messages: allMessages
});
Context Data Structure

interface ProjectContext {
  projects: Array<{
    domain: string;
    name: string;
    created_at: string;
  }>;
  recent_keywords: Array<{
    keyword: string;
    search_volume: number | null;
    difficulty: number | null;
  }>;
  pending_recommendations: Array<{
    title: string;
    description: string;
    priority: string;
  }>;
}
7. FEATURES & CAPABILITIES {#features}
✅ Implemented Features
1. Context-Aware Responses
Fetches user's last 5 projects
Retrieves 20 most recent keywords with metrics
References user's actual data in responses
Personalized recommendations
2. Quick Start Prompts
4 pre-defined expert queries
Icon-based visual design
One-click to ask common questions
Disappears after first interaction
3. Conversation History
Messages stored in database
Persistent across sessions
Can be retrieved and continued
Export functionality for backups
4. Markdown Support
Assistant messages rendered with ReactMarkdown
Supports formatting: bold, italic, lists, links
Code blocks with syntax highlighting
Proper prose styling (dark mode aware)
5. Mobile Responsive
Adaptive sizing for mobile/tablet/desktop
Touch-friendly buttons and inputs
Fullscreen mode on desktop
Proper text scaling
6. Error Handling
Rate limit detection (429)
Payment required handling (402)
Generic error fallbacks
User-friendly toast notifications
7. Loading States
Animated thinking indicator
Disabled input during processing
Visual feedback for all actions
Smooth transitions
8. Export Functionality
Download conversation as JSON
Includes timestamp and session ID
Complete message history
One-click export
9. Accessibility
Keyboard navigation (Enter to send)
Proper ARIA labels
Screen reader friendly
Focus management
10. Real-time UI Updates
Auto-scroll to latest message
Instant message rendering
Smooth animations
No page refresh needed
8. INTEGRATION POINTS {#integration}
Where It's Used
Global Integration (src/App.tsx):


import { SEOAIChatbot } from "@/components/SEOAIChatbot";

<Routes>
  {/* All routes here */}
</Routes>
<SEOAIChatbot />  {/* Available on every page */}
<CookieConsent />
The chatbot appears on every page because it's rendered at the App level, outside the routing context.

Database Tables It Uses
chatbot_conversations - Stores chat history
seo_projects - Fetches user's projects for context
keyword_analysis - Fetches keywords for personalized advice
ai_recommendations - (Currently disabled, ready for future use)
APIs It Calls
Lovable AI Gateway: https://ai.gateway.lovable.dev/v1/chat/completions

Model: google/gemini-2.5-flash
Authentication: LOVABLE_API_KEY (auto-configured)
Supabase Edge Function: seo-ai-chat

Method: invoke()
Authenticated via Supabase client
Secrets Required

LOVABLE_API_KEY=xxx  # Auto-configured by Lovable Cloud
# No other secrets needed!
Authentication Flow

// Uses AuthContext from the app
const { user } = useAuth();

// Only fetches context if user is authenticated
if (user) {
  // Fetch projects, keywords, etc.
}

// Edge function receives userId but doesn't enforce auth
// (This is a security concern noted in the security review)
🎨 VISUAL DESIGN SUMMARY
Color Palette
Primary (Purple): hsl(262, 83%, 58%) - Main brand color
Secondary (Pink): hsl(280, 89%, 60%) - Accent/gradient
Success (Green): rgb(34, 197, 94) - Online indicator
Muted Gray: For secondary text and borders
Typography
Headings: Font-bold, text-sm to text-lg
Body: text-xs to text-sm (responsive)
Markdown: Prose classes with dark mode support
Shadows & Effects
Glow Effect: 0 0 40px hsl(262 83% 58% / 0.5)
Hover Glow: 0 0 50px hsl(262 83% 58% / 0.7)
Card Shadow: Soft blur with primary tint
Animations
Pulse: Online indicator, sparkles icon
Scale: Button hover (110%)
Spin: Loading spinner
Smooth: 300ms transitions
Icons Used
MessageSquare - Main chat icon
Sparkles - AI indicator
Send - Submit button
X - Close button
Download - Export function
Maximize2/Minimize2 - Fullscreen toggle
Search, TrendingUp, Link2 - Quick prompts


WE DONT HAVE LOVABLE API DONT FORGET. WE HAVE GEMINI API .

FILES TO LOOK FOR AND COPY OR GET IDEAS FROM FOLDER C:\Users\kasio\OneDrive\Documents\searchconsole\gsc-gemini-boost\ideas\replate-publish

Core Chatbot Files:
Frontend Component:
src/components/SEOAIChatbot.tsx - Main chatbot UI component
Backend Edge Function:
supabase/functions/seo-ai-chat/index.ts - Edge function that handles AI chat requests
Configuration:
supabase/config.toml - Contains chatbot function configuration (line 28)
Database Migrations:
supabase/migrations/20251001125353_create_user_settings_and_api_keys.sql - Creates chatbot_conversations table (lines 212-294)
supabase/migrations/20251002105242_3574ee0f-5f28-4eab-bfb7-f111ef52a923.sql - Alternative chatbot_conversations table definition (lines 37-59)
Type Definitions:
src/integrations/supabase/types.ts - TypeScript types for chatbot_conversations table (line 247)
Integration Points:
src/App.tsx - Imports and renders the SEOAIChatbot component (lines 25, 67)
src/components/enterprise/AIOOptimizer.tsx - Uses seo-ai-chat function (line 37)
src/components/enterprise/IntentMatcher.tsx - Uses seo-ai-chat function (line 44)
Documentation Files:
COMPLETE_DEPLOYMENT_GUIDE.md - Mentions chatbot (line 153)
COMPLETE_ICONICSTACK_INVENTORY.md - Lists seo-ai-chat function (line 165)
DATABASE_IMPLEMENTATION_SUMMARY.md - Database mapping (lines 74, 251)
EDGE_FUNCTIONS_AUDIT.md - Function audit (line 198)
EDGE_FUNCTIONS_DATABASE_MAPPING.md - Detailed mapping (lines 42-45)
ENTERPRISE_SEO_IMPLEMENTATION.md - Implementation details (lines 176, 280, 292)
PLATFORM_FIXES_IMPLEMENTED.md - Fix history (line 131)
SEO_INTELLIGENCE_FEATURES.md - Feature documentation (line 252)
Summary:
Primary Implementation Files:

src/components/SEOAIChatbot.tsx (Frontend UI)
supabase/functions/seo-ai-chat/index.ts (Backend Logic)
Database table: chatbot_conversations (stores conversation history)
The chatbot is fully integrated into the app and appears globally on all pages (rendered in App.tsx). It's also used by enterprise features like AIOOptimizer and IntentMatcher.



