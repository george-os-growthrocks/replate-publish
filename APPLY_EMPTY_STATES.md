# 🎨 Apply Empty States to Pages

## Quick Implementation Guide

### Pattern to Follow:
```typescript
import { EmptyState, NoDataEmptyState } from "@/components/ui/empty-state";

// In your component, when data is empty:
if (!data || data.length === 0) {
  return (
    <NoDataEmptyState onRefresh={loadData} />
    // OR custom:
    // <EmptyState
    //   icon={YourIcon}
    //   title="Custom Title"
    //   description="Custom description"
    //   actionLabel="Action"
    //   onAction={yourHandler}
    // />
  );
}
```

## ✅ Pages Updated (Add these):

### 1. KeywordResearchPage.tsx
```typescript
// After line 100, when no results:
if (!keywords || keywords.length === 0) {
  return (
    <EmptyState
      icon={Search}
      title="No Keywords Found"
      description="Start your keyword research by entering a seed keyword above"
      actionLabel="Try Example: 'SEO tools'"
      onAction={() => setKeyword('SEO tools')}
    />
  );
}
```

### 2. BacklinksPage.tsx
```typescript
if (!backlinks || backlinks.length === 0) {
  return (
    <EmptyState
      icon={Link2}
      title="No Backlinks Found"
      description="Enter a domain to analyze its backlink profile"
    />
  );
}
```

### 3. ProjectsPage.tsx
```typescript
import { NoProjectsEmptyState } from "@/components/ui/empty-state";

if (!projects || projects.length === 0) {
  return (
    <NoProjectsEmptyState onCreate={() => setShowCreateDialog(true)} />
  );
}
```

### 4. RankingTrackerPage.tsx
```typescript
import { NoKeywordsEmptyState } from "@/components/ui/empty-state";

if (!trackedKeywords || trackedKeywords.length === 0) {
  return (
    <NoKeywordsEmptyState onAdd={() => setShowAddDialog(true)} />
  );
}
```

### 5. SiteAuditPage.tsx
```typescript
if (!auditResults) {
  return (
    <EmptyState
      icon={Gauge}
      title="No Audit Results"
      description="Run a site audit to discover technical SEO issues"
      actionLabel="Start Audit"
      onAction={handleRunAudit}
    />
  );
}
```

## Implementation Status:
- [x] Component created
- [ ] KeywordResearchPage
- [ ] BacklinksPage  
- [ ] ProjectsPage
- [ ] RankingTrackerPage
- [ ] SiteAuditPage

*Add these implementations to respective page files*
