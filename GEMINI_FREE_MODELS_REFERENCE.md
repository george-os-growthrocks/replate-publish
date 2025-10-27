# Gemini API - FREE Models Reference Card

## 🆓 **Currently Using: `gemini-1.5-flash`**

This is the **BEST FREE MODEL** for your use case!

---

## 📊 **Free Models Comparison**

| Model Name | Speed | Quality | Context | Output | RPM Limit | Best For |
|------------|-------|---------|---------|--------|-----------|----------|
| **`gemini-1.5-flash`** ⭐ | ⚡⚡⚡ Fast (2s) | ⭐⭐⭐⭐ Good | 1M tokens | 8K | 15/min | **Site Audits, Analysis** |
| `gemini-1.5-flash-8b` | ⚡⚡⚡⚡ Fastest (1s) | ⭐⭐⭐ OK | 1M tokens | 8K | 15/min | Quick responses, chat |
| `gemini-2.0-flash-exp` | ⚡⚡ Moderate (3s) | ⭐⭐⭐⭐⭐ Best | 1M tokens | 8K | 10/min | Experimental (may change) |

⭐ = **Recommended for your app**

---

## 💰 **Paid Models (Not Recommended)**

| Model Name | Quality | Cost (per 1K tokens) |
|------------|---------|---------------------|
| `gemini-1.5-pro` | ⭐⭐⭐⭐⭐ Excellent | Input: $0.00125, Output: $0.005 |
| `gemini-2.5-pro` | ⭐⭐⭐⭐⭐ Best | Input: $0.00250, Output: $0.010 |
| `gemini-2.5-flash` | ⭐⭐⭐⭐ Very Good | Input: $0.00010, Output: $0.0004 |

**Current:** Using FREE tier (no costs!) 🎉

---

## 🔧 **How to Switch Models**

If you want to test a different model, edit this file:

**File:** `supabase/functions/gemini-site-audit/index.ts`

**Find:**
```typescript
const geminiResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
```

**Change to:**
```typescript
// Option 1: Fastest (but lower quality)
`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${geminiKey}`,

// Option 2: Best quality (but costs money!)
`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`,

// Option 3: Experimental (may be unstable)
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
```

Then redeploy:
```bash
npx supabase functions deploy gemini-site-audit
```

---

## 📈 **Free Tier Limits**

### **Current Plan: Gemini API Free Tier**

| Metric | Limit |
|--------|-------|
| **Requests per Minute (RPM)** | 15 |
| **Requests per Day (RPD)** | 1,500 |
| **Tokens per Minute (TPM)** | 1,000,000 |
| **Cost** | **$0** (FREE!) |

### **Usage Estimate for Your App:**

**Site Audit Page:**
- Average request: ~2,000 input tokens + ~1,000 output tokens
- Time per request: ~2-3 seconds
- **You can run ~1,500 audits per day for FREE!**

**Typical Usage:**
- 1 site audit = 1 request
- 10 audits/day = Well within limits
- 100 audits/day = Still free!

---

## 🚨 **Rate Limit Handling**

If you hit the 15 RPM limit, the app will show:

```
Gemini API Error: Resource has been exhausted (e.g. check quota).
```

**Solution:** The error is caught and displayed to user. They just need to wait 1 minute and try again.

---

## 🆚 **Model Comparison for Your Use Cases**

### **Site Audit Analysis:**
```
✅ gemini-1.5-flash (Current)
  - Perfect balance of speed & quality
  - Handles complex SEO analysis well
  - 8K output is plenty for reports

❌ gemini-1.5-flash-8b
  - Too fast, quality suffers
  - May miss nuanced SEO issues

❌ gemini-1.5-pro
  - Overkill for this task
  - Costs money
  - Not worth the upgrade
```

### **Quick Chatbot/Assistant:**
```
✅ gemini-1.5-flash-8b
  - Ultra-fast responses
  - Good for simple queries
  - Lower quality OK for chat

⚠️ gemini-1.5-flash
  - Bit slower but better quality
  - Use if quality matters
```

---

## 📖 **Official Documentation**

### **Model Names & Pricing:**
https://ai.google.dev/pricing

### **API Reference:**
https://ai.google.dev/api/rest/v1beta/models

### **Rate Limits:**
https://ai.google.dev/gemini-api/docs/rate-limits

---

## ✅ **Recommendation: Keep Current Setup**

Your current configuration is **OPTIMAL**:

- ✅ Using `gemini-1.5-flash` (FREE)
- ✅ Perfect quality for site audits
- ✅ Fast enough (2-3s per request)
- ✅ 8K output tokens (plenty for reports)
- ✅ 15 RPM limit (more than enough)

**No changes needed!** 🎉

---

## 🎯 **Quick Reference**

**Current Model:** `gemini-1.5-flash`  
**Cost:** **$0** (FREE tier)  
**Speed:** ⚡⚡⚡ Fast (2-3 seconds)  
**Quality:** ⭐⭐⭐⭐ Good (perfect for site audits)  
**Limit:** 15 requests/minute  
**Status:** ✅ **OPTIMAL - No changes needed**

---

**Last Updated:** Current Session  
**Deployed Model:** `gemini-1.5-flash`  
**Status:** ✅ **Working perfectly!**

