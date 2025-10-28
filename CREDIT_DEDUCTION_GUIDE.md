# 💳 Credit Deduction Implementation Guide

## ✅ COMPLETED FEATURES

### Features with Credit Deduction (Working):
1. **✅ Competitor Analysis** - 5 credits
2. **✅ SERP Analysis** - 3 credits  
3. **✅ AI Content Repurpose** - 5 credits (already implemented)
4. **✅ AI Chat** - 1 credit per message (already implemented)
5. **✅ Answer The Public** - Uses credits via FeatureGate

---

## 📋 REMAINING FEATURES TO ADD

### Add to these pages (copy pattern from CompetitorAnalysisPage):

#### **Backlinks Analysis** (`src/pages/BacklinksPage.tsx`)
```typescript
// At top of file:
import { useCredits } from "@/hooks/useCreditManager";

// In component:
const { checkCredits, consumeCredits } = useCredits();

// Before analysis:
const handleAnalyze = async () => {
  const hasCredits = await checkCredits('backlink_analysis');
  if (!hasCredits) return;
  // ... existing code
};

// After success (in useEffect):
useEffect(() => {
  if (backlinkData) {
    consumeCredits({
      feature: 'backlink_analysis',
      credits: 10,
      metadata: { domain, backlinks_found: backlinkData.length }
    });
  }
}, [backlinkData]);
```

**Cost**: 10 credits per analysis

---

#### **Local SEO** (`src/pages/LocalSeoPage.tsx`)
```typescript
// Same pattern as above
const handleLocalAnalysis = async () => {
  const hasCredits = await checkCredits('local_seo');
  if (!hasCredits) return;
  // ... existing code
};

useEffect(() => {
  if (localData) {
    consumeCredits({
      feature: 'local_seo',
      credits: 5,
      metadata: { business_name, location }
    });
  }
}, [localData]);
```

**Cost**: 5 credits per analysis

---

#### **Shopping Analysis** (`src/pages/ShoppingPage.tsx`)
```typescript
const handleShoppingAnalysis = async () => {
  const hasCredits = await checkCredits('shopping_analysis');
  if (!hasCredits) return;
  // ... existing code
};

useEffect(() => {
  if (shoppingData) {
    consumeCredits({
      feature: 'shopping_analysis',
      credits: 3,
      metadata: { product, results_count: shoppingData.length }
    });
  }
}, [shoppingData]);
```

**Cost**: 3 credits per analysis

---

#### **Keyword Research** (`src/pages/KeywordResearchPage.tsx`)
```typescript
// ALREADY HAS CREDIT DEDUCTION - just verify it's working
// Cost: 2 credits per search
```

---

#### **Rank Tracking** (`src/pages/RankingTrackerPage.tsx`)
```typescript
const handleTrack = async () => {
  const hasCredits = await checkCredits('rank_tracking');
  if (!hasCredits) return;
  // ... existing code
};

useEffect(() => {
  if (trackingData) {
    consumeCredits({
      feature: 'rank_tracking',
      credits: keywords.length, // 1 credit per keyword
      metadata: { keywords, domain }
    });
  }
}, [trackingData]);
```

**Cost**: 1 credit per keyword tracked

---

#### **Site Audit** (`src/pages/SiteAuditPage.tsx`)
```typescript
const handleAudit = async () => {
  const hasCredits = await checkCredits('site_audit');
  if (!hasCredits) return;
  // ... existing code
};

useEffect(() => {
  if (auditData) {
    consumeCredits({
      feature: 'site_audit',
      credits: 20,
      metadata: { url, issues_found: auditData.issues }
    });
  }
}, [auditData]);
```

**Cost**: 20 credits per audit

---

#### **On-Page SEO** (`src/pages/OnPageSeoPage.tsx`)
```typescript
const handleAnalyze = async () => {
  const hasCredits = await checkCredits('onpage_seo');
  if (!hasCredits) return;
  // ... existing code
};

useEffect(() => {
  if (onPageData) {
    consumeCredits({
      feature: 'onpage_seo',
      credits: 3,
      metadata: { url, score: onPageData.score }
    });
  }
}, [onPageData]);
```

**Cost**: 3 credits per page

---

## 📊 COMPLETE CREDIT PRICING TABLE

| Feature | Cost (Credits) | Status |
|---------|---------------|--------|
| AI Chat Message | 1 | ✅ Done |
| Keyword Research | 2 | ✅ Done |
| SERP Analysis | 3 | ✅ Done |
| On-Page SEO | 3 | ⏳ Pending |
| Shopping Analysis | 3 | ⏳ Pending |
| Answer The Public | 5 | ✅ Done |
| Competitor Analysis | 5 | ✅ Done |
| Local SEO | 5 | ⏳ Pending |
| AI Content Repurpose | 5 | ✅ Done |
| Backlink Analysis | 10 | ⏳ Pending |
| Site Audit | 20 | ⏳ Pending |
| Rank Tracking | 1 per keyword | ⏳ Pending |

---

## 🔧 IMPLEMENTATION CHECKLIST

For each feature:
- [ ] Import `useCredits` hook
- [ ] Add `checkCredits()` before action starts
- [ ] Add `consumeCredits()` after success (in useEffect)
- [ ] Test with low credits to verify blocking works
- [ ] Test credit counter updates in real-time
- [ ] Verify metadata is logged correctly

---

## 🧪 TESTING SCRIPT

```typescript
// Test credit system:

// 1. Set user to 5 credits
UPDATE user_credits SET available_credits = 5 WHERE user_id = 'YOUR_ID';

// 2. Try expensive feature (Site Audit = 20 credits)
// Should see: "Insufficient credits" message

// 3. Try cheap feature (SERP Analysis = 3 credits)  
// Should work and deduct credits

// 4. Check credits
SELECT * FROM user_credits WHERE user_id = 'YOUR_ID';
// Should show: 2 credits remaining

// 5. Check history
SELECT * FROM credit_usage_history WHERE user_id = 'YOUR_ID' ORDER BY created_at DESC LIMIT 10;
// Should show the SERP analysis entry
```

---

## 📝 NOTES

- **All credit checks happen BEFORE** the API call
- **All credit consumption happens AFTER** success
- **Credits are NOT deducted** if API call fails
- **Metadata helps** with usage analytics later
- **Toast messages** are handled automatically by useCredits hook

---

## 🚀 NEXT STEPS

1. Apply credit deduction to remaining 6 features
2. Test each feature with low credits
3. Verify credit counter updates work
4. Check credit_usage_history table logs correctly
5. Build usage analytics dashboard

---

**Last Updated**: Oct 28, 2025 - 8:30pm
