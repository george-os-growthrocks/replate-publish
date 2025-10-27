# 🔧 AI Chatbot Debugging Guide

## 🚨 Issue: "I apologize, but I couldn't generate a response"

If you're seeing this error, here's how to diagnose and fix it!

---

## 📊 **Step 1: Check Browser Console**

1. **Open DevTools:** Press `F12` or right-click → Inspect
2. **Go to Console tab**
3. **Try your question again**
4. **Look for these logs:**

```
🔍 Fetching comprehensive context for...
✅ Context loaded: { property: ..., keywords: X, queries: Y }
📥 Edge function response: { data: {...}, error: null }
```

### If you see:
- ✅ `✅ Adding assistant message to chat` → **Working correctly!**
- ❌ `❌ No message in response` → **Edge function returned empty**
- ❌ `❌ Edge function error` → **Edge function failed**
- ❌ `💥 Chat error` → **Frontend error**

---

## 🔍 **Step 2: Check Supabase Edge Function Logs**

### Option A: Via Dashboard
1. Go to https://supabase.com/dashboard/project/siwzszmukfbzicjjkxro/functions
2. Click on `seo-ai-chat`
3. Go to "Logs" tab
4. Look for recent errors

### Option B: Via CLI (doesn't work with --tail)
```bash
# View recent logs
npx supabase functions logs seo-ai-chat
```

### What to look for:
```
📥 Gemini API response: { ... }
🔧 AI wants to call function: analyze_keyword
✅ Tool result: { ... }
✓ AI chat response generated (XXX chars)
```

### Common Errors:
- ❌ `No candidate in response` → Gemini blocked the response
- ❌ `No text in candidate` → Response format unexpected
- ❌ `Gemini API error: 400` → Invalid request format
- ❌ `Gemini API error: 403` → API key issue
- ❌ `Gemini API error: 429` → Rate limit exceeded

---

## 🐛 **Common Issues & Fixes**

### Issue 1: Safety Filters Blocking Response
**Symptom:** "No candidate in response"

**Cause:** Gemini's safety filters are blocking the response

**Fix:**
```typescript
// In seo-ai-chat/index.ts, relax safety settings
safetySettings: [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
]
```

### Issue 2: Function Calling Format Error
**Symptom:** Gemini API returns 400 error

**Cause:** Function declaration format is wrong

**Fix:** Check `_tools.ts` - ensure format matches Gemini's spec:
```typescript
{
  function_declarations: [
    {
      name: "analyze_keyword",
      description: "...",
      parameters: {
        type: "object",
        properties: { ... },
        required: ["keyword"]
      }
    }
  ]
}
```

### Issue 3: API Key Not Set
**Symptom:** "GEMINI_API_KEY is not configured"

**Fix:**
```bash
# Set in Supabase dashboard
Settings → Edge Functions → Add environment variable
Name: GEMINI_API_KEY
Value: your-api-key-here
```

### Issue 4: Context Too Large
**Symptom:** 400 error or timeout

**Cause:** Too much context data (50 keywords + 20 queries)

**Fix:** Reduce context size in `SEOAIChatbot.tsx`:
```typescript
.limit(20);  // Instead of 50 for keywords
.limit(10);  // Instead of 20 for queries
```

---

## 🧪 **Testing Strategy**

### Test 1: Simple Message (No Tools)
**Try:** "Hello, what can you do?"

**Expected:** Welcome message with capabilities

**If fails:** Issue with basic Gemini API or safety filters

### Test 2: Context Awareness
**Try:** "What keywords am I tracking?"

**Expected:** Lists YOUR actual keywords

**If fails:** Context not being fetched or passed correctly

### Test 3: Function Calling
**Try:** "Analyze keyword 'test'"

**Expected:** AI calls `analyze_keyword` tool and returns data

**If fails:** Function calling implementation issue

---

## 📊 **Enhanced Logging (Already Implemented!)**

### Frontend Logs:
```typescript
console.log("🔍 Fetching comprehensive context for...");
console.log("✅ Context loaded:", { keywords: X, queries: Y });
console.log("📥 Edge function response:", { data, error });
console.log("✅ Adding assistant message to chat");
```

### Backend Logs:
```typescript
console.log("📥 Gemini API response:", JSON.stringify(data));
console.log("🔧 AI wants to call function:", functionName);
console.log("✅ Tool result:", result);
console.log("✓ AI chat response generated (XXX chars)");
```

---

## 🚀 **Quick Fix Checklist**

- [ ] Check browser console for errors
- [ ] Check Supabase function logs
- [ ] Verify GEMINI_API_KEY is set
- [ ] Try simpler question first
- [ ] Clear browser cache & refresh
- [ ] Check Supabase status page
- [ ] Verify edge function is deployed
- [ ] Check API quotas/rate limits

---

## 🔄 **Current Status**

**Deployed:**
- ✅ Edge function: `seo-ai-chat`
- ✅ Enhanced logging enabled
- ✅ Better error messages
- ✅ Frontend error handling improved

**Next Steps:**
1. Try the chatbot again
2. Check browser console (F12)
3. Look for the new detailed logs
4. Report what you see!

---

## 💡 **Debug Commands**

### View Logs:
```bash
# Browser console
F12 → Console tab

# Edge function logs (via dashboard)
https://supabase.com/dashboard/project/siwzszmukfbzicjjkxro/functions
```

### Redeploy:
```bash
npx supabase functions deploy seo-ai-chat --no-verify-jwt
```

### Test Locally (if Docker running):
```bash
npx supabase functions serve seo-ai-chat
```

---

## 📞 **What to Report**

If still having issues, provide:

1. **Browser console output** (full logs)
2. **Edge function logs** (from Supabase dashboard)
3. **Exact question asked**
4. **Any error messages**
5. **Screenshot of browser console**

This will help diagnose the exact issue!

---

## ✅ **Expected Flow**

**Successful chat:**
```
User: "Analyze keyword 'seo tools'"
  ↓
Frontend: Fetch context (50 keywords, 20 queries)
  ↓
Frontend: Call edge function
  ↓
Backend: Build system prompt with context
  ↓
Backend: Call Gemini with function calling
  ↓
Gemini: "I'll use analyze_keyword tool"
  ↓
Backend: Execute analyze_keyword('seo tools')
  ↓
Backend: Send result back to Gemini
  ↓
Gemini: Interpret and respond with analysis
  ↓
Frontend: Display beautiful markdown response
  ↓
User: Sees detailed keyword analysis! 🎉
```

---

**Current Status:** ✅ **DEBUGGING ENABLED - READY TO TEST!**

**Next:** Try the chatbot and check console logs!

