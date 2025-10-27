# 🧠 AnotherSEOGuru AI - Context & Training System

## Overview

**AnotherSEOGuru AI** is trained on each user's actual SEO data to provide personalized, actionable recommendations. Unlike generic SEO assistants, it references your specific domains, keywords, and rankings in every response.

---

## 📊 Data Sources

### 1. **GSC Properties** (`gsc_properties` table)
```sql
SELECT property_url FROM gsc_properties 
WHERE user_id = [current_user] 
LIMIT 5
```

**What AI Knows:**
- User's active domain names
- Which sites they're tracking
- Property-specific context for recommendations

**Example AI Response:**
> "Looking at your domain **example.com**, I can see you're tracking 15 keywords..."

---

### 2. **Tracked Keywords** (`tracked_keywords` table)
```sql
SELECT keyword, current_position, search_volume 
FROM tracked_keywords 
WHERE user_id = [current_user] 
  AND is_active = true 
ORDER BY created_at DESC 
LIMIT 20
```

**What AI Knows:**
- Exact keywords user is monitoring
- Current ranking position (1-100 or "Not Ranked")
- Monthly search volume
- Which keywords need immediate attention

**Example AI Response:**
> "I see your keyword **'seo tools'** is currently at position #12 with 5,400 monthly searches. Here's how to push it into the top 10..."

---

### 3. **GSC Query Data** (via `gsc-query` function)
```typescript
{
  queries: [
    { query, clicks, impressions, ctr, position }
  ]
}
```

**What AI Knows:**
- Which queries are driving traffic
- Click-through rates and impressions
- Average positions per query
- CTR optimization opportunities

**Example AI Response:**
> "Your query **'best seo software'** has 2,300 impressions but only 23 clicks (1% CTR). This is a huge opportunity - let's improve your title tag..."

---

### 4. **Algorithm Updates** (`google_algorithm_updates` table)
```sql
SELECT name, date, impact_level, description 
FROM google_algorithm_updates 
WHERE date > NOW() - INTERVAL '90 days'
```

**What AI Knows:**
- Recent Google algorithm changes
- Potential impact on user's rankings
- When to expect volatility

**Example AI Response:**
> "The October 2024 Core Update may have affected your rankings. Let's analyze your top keywords for correlation..."

---

## 🎯 Context Building Process

### Step 1: User Sends Message
```typescript
const userMessage = "How can I improve my rankings?";
```

### Step 2: Fetch User Context (Frontend)
```typescript
// Get user's properties
const { data: properties } = await supabase
  .from("gsc_properties")
  .select("property_url")
  .eq("user_id", user.id)
  .limit(5);

// Get tracked keywords with performance
const { data: trackedKeywords } = await supabase
  .from("tracked_keywords")
  .select("keyword, current_position, search_volume")
  .eq("user_id", user.id)
  .eq("is_active", true)
  .limit(20);

const projectContext = {
  properties: properties?.map(p => p.property_url) || [],
  tracked_keywords: trackedKeywords || [],
};
```

### Step 3: Build Contextual Prompt (Backend)
```typescript
let contextualPrompt = "\n\n**USER'S CURRENT SEO DATA:**\n";

contextualPrompt += `- Active Domains: ${properties.join(", ")}\n`;

contextualPrompt += `- Tracked Keywords (${keywords.length} total):\n`;
keywords.forEach(k => {
  const position = k.current_position < 100 ? `Position #${k.current_position}` : 'Not Ranked';
  const volume = k.search_volume ? `Vol: ${k.search_volume}` : 'Vol: N/A';
  contextualPrompt += `  • "${k.keyword}" - ${position}, ${volume}\n`;
});
```

### Step 4: Inject Context into System Prompt
```typescript
const systemPrompt = `You are AnotherSEOGuru AI...${contextualPrompt}

**IMPORTANT CONTEXT RULES:**
- Reference the user's actual domain names and keywords
- Provide specific recommendations based on current rankings
- Suggest improvements for underperforming keywords (position > 10)
- Congratulate high-ranking keywords (position ≤ 5)
`;
```

### Step 5: Send to Gemini with Full Context
```typescript
const geminiMessages = [
  { role: "user", parts: [{ text: systemPrompt }] },
  { role: "model", parts: [{ text: "Understood. I'm ready with your data." }] },
  { role: "user", parts: [{ text: userMessage }] }
];
```

---

## 💡 AI Response Examples

### Example 1: Generic User (No Data)
**User:** "How can I improve my SEO?"

**AI Response:**
> "I'd love to help you improve your SEO! To give you personalized advice, please:
> 1. Connect your Google Search Console account
> 2. Add some keywords to track in the Ranking Tracker
> 3. Come back and ask me again - I'll analyze your actual data!"

---

### Example 2: User with Tracked Keywords
**User:** "How can I improve my SEO?"

**AI Response:**
> "Great question! Looking at your domain **example.com**, here's what I see:
> 
> **Quick Wins (Top Opportunities):**
> • **'seo tools'** (Position #12, 5,400 vol) - You're on page 2! Let's push this to page 1:
>   - Improve your title tag to include power words
>   - Add a FAQ section targeting 'best seo tools'
>   - Build 3-5 quality backlinks from SEO blogs
> 
> • **'keyword research tool'** (Position #8, 1,900 vol) - So close to top 5!
>   - Add comparison tables to your content
>   - Target featured snippet with a clear definition
> 
> **Celebrate Your Wins:**
> • **'free seo checker'** (Position #3, 2,700 vol) - Excellent! Maintain this by:
>   - Updating content monthly
>   - Adding fresh examples
> 
> Want me to dive deeper into any of these?"

---

### Example 3: User Asks About Specific Keyword
**User:** "What should I do about 'seo tools'?"

**AI Response:**
> "Let's analyze **'seo tools'** for **example.com**:
> 
> **Current Status:**
> - Position: #12 (Page 2)
> - Search Volume: 5,400/month
> - Potential Traffic: ~270 clicks/month if you reach position #3
> 
> **Action Plan:**
> 1. **Content Gap Analysis** 
>    - Go to Content Gap page and compare with top 3 competitors
>    - Identify missing topics they cover
> 
> 2. **On-Page Optimization**
>    - Title: Include 'Best' and '2024'
>    - Add comparison table of top 10 SEO tools
>    - Update meta description to boost CTR
> 
> 3. **Technical SEO**
>    - Run Site Audit to fix any crawl errors
>    - Improve Core Web Vitals score
> 
> 4. **Backlinks**
>    - Check Backlinks page for gap analysis
>    - Target 5-7 quality links from SEO blogs
> 
> This could move you to page 1 within 4-6 weeks. Want specific backlink targets?"

---

## 🔧 Advanced Context Features (Future)

### Planned Data Sources:

1. **GSC Pages Data**
   ```sql
   SELECT page, clicks, impressions, ctr, position
   FROM gsc_pages_cache
   WHERE user_id = [current_user]
   ORDER BY impressions DESC
   LIMIT 20
   ```

2. **Site Audit Results**
   ```sql
   SELECT issue_type, severity, affected_urls
   FROM site_audit_results
   WHERE property_url = [user_property]
   AND audit_date > NOW() - INTERVAL '7 days'
   ```

3. **Backlink Profile**
   ```sql
   SELECT domain, domain_authority, anchor_text, status
   FROM backlinks
   WHERE target_url LIKE '%' || [user_domain] || '%'
   ORDER BY domain_authority DESC
   LIMIT 50
   ```

4. **Competitor Data**
   ```sql
   SELECT competitor_domain, overlap_keywords, avg_position
   FROM competitor_analysis
   WHERE user_domain = [user_domain]
   ```

5. **Historical Trends**
   ```sql
   SELECT keyword, position, checked_at
   FROM keyword_rankings
   WHERE keyword_id IN (
     SELECT id FROM tracked_keywords WHERE user_id = [current_user]
   )
   AND checked_at > NOW() - INTERVAL '90 days'
   ORDER BY checked_at DESC
   ```

---

## 🎨 Personalization Levels

### Level 1: Guest User (No Auth)
- Generic SEO advice
- Platform feature explanations
- Best practices and guides
- **No personalized data**

### Level 2: Authenticated User (No Data)
- Everything from Level 1, plus:
- Encouragement to connect GSC
- Guidance on setting up tracking
- Onboarding assistance

### Level 3: User with Properties
- Everything from Level 2, plus:
- Domain-specific recommendations
- References to their actual sites
- Property-level context

### Level 4: User with Tracked Keywords (CURRENT)
- Everything from Level 3, plus:
- **Keyword-specific strategies**
- **Position-based recommendations**
- **Volume-weighted priorities**
- **Performance trend analysis**

### Level 5: Full Context (FUTURE)
- Everything from Level 4, plus:
- GSC query data integration
- Page-level optimization
- Backlink gap identification
- Competitor strategy insights
- Algorithm impact detection
- Historical trend correlation

---

## 📝 Context Prompt Template

```typescript
**USER'S CURRENT SEO DATA:**

- Active Domains: example.com, test-site.org

- Tracked Keywords (20 total):
  • "seo tools" - Position #12, Vol: 5400
  • "keyword research" - Position #8, Vol: 1900
  • "free seo checker" - Position #3, Vol: 2700
  • "backlink analyzer" - Not Ranked, Vol: 1200
  • "serp tracker" - Position #15, Vol: 890
  ...

**IMPORTANT CONTEXT RULES:**
- Reference the user's actual domain names and keywords
- Provide specific, actionable recommendations based on current rankings
- If they ask about their site, use data from their tracked domains
- Suggest improvements for underperforming keywords (position > 10)
- Congratulate and suggest maintenance strategies for high-ranking keywords (position ≤ 5)
```

---

## 🚀 Best Practices

### For Users:
1. **Connect GSC** - The more data, the better the AI advice
2. **Track Keywords** - AI needs keywords to provide specific guidance
3. **Ask Specific Questions** - "How do I improve 'seo tools'?" vs "Help me with SEO"
4. **Use AI for Strategy** - Not just feature explanations, but actual SEO tactics

### For Developers:
1. **Always check for null/undefined** - Not all users have data
2. **Limit context size** - 10-20 keywords max (token limits)
3. **Cache user context** - Don't fetch on every message
4. **Prioritize by importance** - Show high-volume or poorly-ranking keywords first
5. **Handle errors gracefully** - If data fetch fails, AI still works with generic advice

---

## 🎯 Success Metrics

**AI is working well when:**
- ✅ Users see their actual domain names in responses
- ✅ AI references specific keywords they're tracking
- ✅ Recommendations include position numbers and volumes
- ✅ Advice is actionable and prioritized
- ✅ Users report feeling the AI "knows their site"

**AI needs improvement when:**
- ❌ Responses are too generic
- ❌ AI doesn't use user's actual data
- ❌ Recommendations aren't specific to their situation
- ❌ Users ask "How do you know about my site?"

---

**The Context System is LIVE!** Every conversation is now personalized with the user's actual SEO data! 🚀

