# 🧪 TESTING GUIDE: AnotherSEOGuru AI

## 🎯 **What We're Testing**

The world's most advanced SEO AI chatbot with:
- ✅ Property persistence
- ✅ Comprehensive context (50 keywords, 20 GSC queries)
- ✅ Function calling (6 interactive tools)
- ✅ Real-time data fetching
- ✅ Beautiful markdown responses

---

## 📋 **Pre-Test Checklist**

Before testing, ensure:
1. ✅ You have at least 1 GSC property added
2. ✅ You have at least 1 tracked keyword
3. ✅ GSC data has been synced (visit Dashboard)
4. ✅ Edge function is deployed: `seo-ai-chat`
5. ✅ Browser is refreshed (F5)

---

## 🧪 **TEST SUITE**

### Test 1: Basic Chatbot Functionality
**Objective:** Verify chatbot opens and responds

**Steps:**
1. Look for purple glowing button (bottom-right)
2. Click button
3. Chatbot window should slide up
4. See welcome message with features list

**Expected Result:**
```
✅ Chatbot opens
✅ Welcome message displays
✅ 4 quick prompt buttons visible
✅ Input field is functional
```

---

### Test 2: Property Persistence
**Objective:** Verify selected property persists across page refresh

**Steps:**
1. In dashboard, select a property from dropdown
2. Note the property name (e.g., "example.com")
3. Refresh browser (F5)
4. Open chatbot
5. Look at header subtitle

**Expected Result:**
```
✅ Header shows: "📍 example.com"
✅ Property is remembered after refresh
✅ Property name is visible in chatbot header
```

**If Failed:**
- Check browser console for localStorage errors
- Verify FilterContext is working
- Check for "📍 Loaded saved property" log in console

---

### Test 3: Context Awareness (Tracked Keywords)
**Objective:** Verify AI knows user's tracked keywords

**Steps:**
1. Ensure you have at least 2-3 tracked keywords
2. Open chatbot
3. Type: "What keywords am I tracking?"
4. Send message

**Expected Result:**
AI responds with YOUR actual keywords:
```
✅ AI lists your real keyword names
✅ Shows positions (e.g., Position #12)
✅ Shows search volumes
✅ Shows trends (📈/📉)
```

**Example Response:**
```
You're tracking 5 keywords for example.com:

• "seo tools" - Position #12, Vol: 5400 📈
• "keyword research" - Position #15, Vol: 2900
• "backlink checker" - Position #18, Vol: 1200 📉
...

Would you like me to analyze any of these in detail?
```

---

### Test 4: GSC Data Access
**Objective:** Verify AI can access GSC data

**Steps:**
1. Select a property with GSC data
2. Open chatbot
3. Click "📊 Show my GSC data" quick prompt (OR type manually)
4. Wait for response

**Expected Result:**
AI responds with YOUR actual GSC data:
```
✅ Shows clicks, impressions, CTR, position
✅ Lists top queries from GSC
✅ Data matches your dashboard
✅ Mentions your domain name
```

**Example Response:**
```
📊 GSC Performance for example.com (Last 28 Days):

Overall Metrics:
• Total Clicks: 2,345 (+12%)
• Total Impressions: 89,234 (+8%)
• Average CTR: 2.63%
• Average Position: 12.4

Top Queries:
1. "seo tools" - 234 clicks, Position #3
2. "keyword research" - 189 clicks, Position #2
...
```

---

### Test 5: Function Calling (Keyword Analysis)
**Objective:** Verify AI can call analyze_keyword tool

**Steps:**
1. Open chatbot
2. Type: "Analyze the keyword 'paros rent a car'"
3. Send message
4. Watch browser console (F12)

**Expected Result:**

**In Console:**
```
🔍 Fetching comprehensive context for...
✅ Context loaded: { property: ..., keywords: 5, queries: 20 }
[Edge function logs]
🔧 Executing tool: analyze_keyword
✅ Tool result: {...}
```

**In Chatbot:**
AI responds with formatted keyword data:
```
✅ Shows search volume
✅ Shows keyword difficulty
✅ Shows CPC
✅ Shows related keywords
✅ Shows SERP features
✅ Provides actionable recommendations
```

**Example Response:**
```
📊 Keyword Analysis: 'paros rent a car'

Search Metrics:
• Monthly Search Volume: 1,400
• Keyword Difficulty: 32/100 (Medium)
• Cost Per Click: $1.85
• Trend: +15% vs last month

Related Opportunities:
• "car rental paros" - 2,900 vol, KD: 28
• "rent a car paros airport" - 720 vol, KD: 25

🎯 Action Plan:
1. Add "2024 Guide" to title
2. Create pricing table
3. Build 3-5 backlinks
...
```

---

### Test 6: Multiple Tool Calls
**Objective:** Verify AI can handle complex queries requiring multiple tools

**Steps:**
1. Open chatbot
2. Type: "Analyze my GSC data, then tell me which of my tracked keywords I should focus on"
3. Send message

**Expected Result:**
```
✅ AI calls get_gsc_data first
✅ AI interprets GSC results
✅ AI references tracked keywords from context
✅ AI provides prioritized recommendations
✅ Response is comprehensive and actionable
```

---

### Test 7: Quick Prompts
**Objective:** Verify all 4 quick prompts work

**Test Each Prompt:**

**Prompt 1:** 🔍 Analyze a keyword
- Click it
- Verify prompt appears in input field
- Send message
- Verify AI analyzes a keyword

**Prompt 2:** 📊 Show my GSC data
- Click it
- Verify AI fetches GSC data
- Verify shows YOUR domain's data

**Prompt 3:** 🎯 Find quick wins
- Click it
- Verify AI analyzes position 6-20 keywords
- Verify suggests actionable improvements

**Prompt 4:** 🔥 Competitor analysis
- Click it
- Verify AI discusses competitor strategies
- Verify asks for specific keyword to analyze

---

### Test 8: Property Switching
**Objective:** Verify chatbot updates when property changes

**Steps:**
1. Open chatbot (property A selected)
2. Note the "📍 domain-a.com" in header
3. Close chatbot
4. Switch property to domain-b.com
5. Re-open chatbot
6. Check header

**Expected Result:**
```
✅ Header updates to "📍 domain-b.com"
✅ AI context refreshes for new property
✅ Next message uses domain-b.com data
```

---

### Test 9: Markdown Formatting
**Objective:** Verify responses render beautifully

**Steps:**
1. Ask AI any question
2. Look at response formatting

**Expected Result:**
```
✅ **Bold text** renders bold
✅ *Italic text* renders italic
✅ Bullet points (•) render properly
✅ Numbered lists render properly
✅ Emojis display correctly
✅ Line breaks are preserved
✅ Headers (#, ##) render as headings
```

---

### Test 10: Conversation History
**Objective:** Verify AI remembers previous messages

**Steps:**
1. Send: "Analyze keyword 'seo tools'"
2. Wait for response
3. Send: "What was the search volume?"
4. Wait for response

**Expected Result:**
```
✅ AI remembers "seo tools" keyword
✅ AI references previous response
✅ AI provides specific number
✅ Conversation feels natural
```

---

## 🐛 **TROUBLESHOOTING**

### Issue: Chatbot doesn't open
**Fix:**
- Hard refresh browser (Ctrl + Shift + R)
- Check console for errors
- Verify `SEOAIChatbot` is rendered in App.tsx

### Issue: No property in header
**Fix:**
- Select a property in dashboard first
- Refresh browser
- Check localStorage: `anotherseo_selected_property`

### Issue: AI doesn't know tracked keywords
**Fix:**
- Verify keywords exist in `tracked_keywords` table
- Check browser console for context logs
- Verify Supabase connection

### Issue: Function calling doesn't work
**Fix:**
- Check edge function logs (Supabase dashboard)
- Verify GEMINI_API_KEY is set
- Check browser console for errors
- Verify `_tools.ts` is deployed with edge function

### Issue: GSC data not showing
**Fix:**
- Sync GSC data (visit Dashboard, wait for load)
- Verify property has GSC data in last 28 days
- Check `gsc_properties` table in Supabase

### Issue: AI gives generic responses
**Fix:**
- Verify context is being sent (check console)
- Ensure user has tracked keywords
- Ensure property is selected
- Check system prompt in edge function

---

## 📊 **SUCCESS CRITERIA**

Your AI is working perfectly if:

- ✅ Property persists across page refreshes
- ✅ AI mentions YOUR actual domain name
- ✅ AI lists YOUR actual tracked keywords
- ✅ AI shows YOUR actual GSC data
- ✅ Function calling works (check console logs)
- ✅ Responses are beautifully formatted
- ✅ Responses are specific and actionable
- ✅ Conversation feels natural and intelligent

---

## 🎉 **NEXT STEPS AFTER TESTING**

Once all tests pass:

1. **Connect Real DataForSEO APIs:**
   - Update `_tools.ts` with real API calls
   - Replace placeholder data
   - Test with real keyword data

2. **Add Loading States:**
   - Show "🔍 Analyzing keyword..." while tool executes
   - Add progress indicators
   - Enhance user feedback

3. **Add More Tools:**
   - Content gap analysis
   - Keyword clustering
   - SERP feature optimization
   - Historical trend analysis

4. **Polish UI:**
   - Add export conversation button
   - Add streaming responses
   - Add voice input
   - Add keyboard shortcuts

5. **Analytics:**
   - Track most used tools
   - Track most asked questions
   - Measure user satisfaction

---

## 🚀 **YOU'RE READY!**

If all tests pass, you have successfully built:

**THE WORLD'S MOST ADVANCED SEO AI CHATBOT!**

- 🎯 Context-aware
- 🔧 Tool-enabled
- 📊 Data-driven
- 💬 Conversational
- 🎨 Beautiful
- ⚡ Fast
- 🏆 Best-in-class

**GO TEST IT NOW!** 🎉

