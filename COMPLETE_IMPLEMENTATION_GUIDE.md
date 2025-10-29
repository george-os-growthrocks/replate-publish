# Complete Implementation Guide
## Industry Profile Training & Enhanced Subscription System

This document provides step-by-step instructions to implement all requested features.

## 📋 Overview

### What's Been Implemented:

1. **Industry-Specific Business Profile Training System**
   - Customizable questionnaires for different industries (Rent-a-car, Hotels, Restaurants, E-commerce)
   - Competitor analysis tracking
   - Seasonal intelligence gathering
   - Customer demographics profiling
   - AI-powered business insights generation

2. **Updated Subscription Pricing**
   - Starter: $29/month (500 credits)
   - Pro: $79/month (2,000 credits)
   - Agency: $149/month (5,000 credits)
   - Enterprise: $299/month (unlimited credits)

3. **Creator Unlimited Access**
   - Email: kasiotisg@gmail.com configured with unlimited credits
   - Access to all features
   - Bypass rate limits

4. **Individual Feature Packages**
   - Answer The Public Unlimited: $19/mo
   - AI Content Briefs Pro: $29/mo
   - Bulk Analyzer Pro: $39/mo
   - Premium Backlink Analysis: $49/mo
   - AI SEO Assistant Unlimited: $25/mo
   - Local SEO Suite: $59/mo

5. **Credit Packages** (One-time purchases)
   - Starter Pack: 100 credits for $10
   - Growth Pack: 500 + 50 bonus for $40
   - Pro Pack: 1000 + 150 bonus for $70
   - Scale Pack: 5000 + 1000 bonus for $300
   - Enterprise Pack: 10000 + 2500 bonus for $500

---

## 🚀 Deployment Steps

### Step 1: Deploy Database Migrations

Since automated deployment requires database password, use Supabase Dashboard:

1. Go to https://supabase.com/dashboard/project/siwzszmukfbzicjjkxro/sql/new

2. **First Migration** - Copy and paste contents of:
   `supabase/migrations/20251029000000_industry_profile_training.sql`
   
3. Click "RUN" and wait for completion

4. **Second Migration** - Copy and paste contents of:
   `supabase/migrations/20251029000001_updated_pricing_and_credits.sql`
   
5. Click "RUN" and wait for completion

6. **Verify** - Check that these new tables exist:
   - industry_intelligence
   - business_insights
   - industry_training_templates
   - feature_packages
   - credit_packages
   - user_special_permissions

### Step 2: Verify Creator Account Setup

Run this query in Supabase SQL Editor to verify unlimited access:

```sql
SELECT 
  u.email,
  usp.has_unlimited_credits,
  usp.permission_level,
  uc.total_credits,
  sp.name as plan_name
FROM auth.users u
LEFT JOIN user_special_permissions usp ON u.id = usp.user_id
LEFT JOIN user_credits uc ON u.id = uc.user_id
LEFT JOIN user_subscriptions us ON u.id = us.user_id
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE u.email = 'kasiotisg@gmail.com';
```

You should see:
- `has_unlimited_credits`: true
- `permission_level`: creator
- `total_credits`: 999999999
- `plan_name`: Enterprise

---

## 📦 Frontend Components to Create

### 1. Industry Profile Training Wizard

Create `src/components/onboarding/IndustryProfileWizard.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Building2, Car, Hotel, UtensilsCrossed, ShoppingBag } from 'lucide-react';

interface IndustryTemplate {
  business_type: string;
  display_name: string;
  questions: any[];
}

interface Question {
  id: string;
  question: string;
  type: string;
  options?: string[];
  required: boolean;
}

const industryIcons = {
  rent_a_car: Car,
  hotel: Hotel,
  restaurant: UtensilsCrossed,
  ecommerce: ShoppingBag,
  default: Building2
};

export function IndustryProfileWizard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [templates, setTemplates] = useState<IndustryTemplate[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [currentTemplate, setCurrentTemplate] = useState<IndustryTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [step, setStep] = useState<'select' | 'questionnaire' | 'review'>('select');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('industry_training_templates')
        .select('*')
        .order('display_name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load industry templates');
    } finally {
      setLoading(false);
    }
  };

  const selectIndustry = (businessType: string) => {
    const template = templates.find(t => t.business_type === businessType);
    if (template) {
      setSelectedIndustry(businessType);
      setCurrentTemplate(template);
      setStep('questionnaire');
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!currentTemplate) return;

    // Validate required questions
    const questions = currentTemplate.questions as Question[];
    const missingRequired = questions
      .filter(q => q.required && !answers[q.id])
      .map(q => q.question);

    if (missingRequired.length > 0) {
      toast.error(`Please answer all required questions: ${missingRequired.join(', ')}`);
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Parse answers to extract structured data
      const competitors = answers.competitors?.split('\n').filter((c: string) => c.trim()) || [];
      const peakMonths = answers.peak_months || [];
      const customerCountries = answers.customer_countries?.split(',').map((c: string) => c.trim()) || [];

      // Save industry intelligence
      const { error: intelligenceError } = await supabase
        .from('industry_intelligence')
        .upsert({
          user_id: user.id,
          business_type: currentTemplate.business_type,
          competitors: competitors.map((c: string) => ({ name: c })),
          peak_seasons: peakMonths.length > 0 ? [{ months: peakMonths, description: 'Primary peak season' }] : [],
          primary_countries: customerCountries.map(country => ({ country, percentage: null })),
          product_categories: answers.vehicle_types || answers.room_types || answers.cuisine_type || [],
          best_sellers: answers.best_selling ? [{ name: answers.best_selling }] : [],
          price_range: answers.price_range ? { range: answers.price_range } : {}
        });

      if (intelligenceError) throw intelligenceError;

      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          business_type: currentTemplate.business_type,
          target_location: answers.location,
          industry_profile: answers,
          is_profile_trained: true,
          training_completed_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // Generate insights
      await supabase.rpc('generate_business_insights', { p_user_id: user.id });

      toast.success('Profile training completed! Generating personalized insights...');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Industry Selection Step
  if (step === 'select') {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Tell Us About Your Business</h1>
          <p className="text-muted-foreground">
            Help us understand your industry so we can provide personalized SEO insights
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((template) => {
            const Icon = industryIcons[template.business_type as keyof typeof industryIcons] || industryIcons.default;
            return (
              <Card
                key={template.business_type}
                className="cursor-pointer hover:border-primary transition-all"
                onClick={() => selectIndustry(template.business_type)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className="w-8 h-8 text-primary" />
                    <div>
                      <CardTitle>{template.display_name}</CardTitle>
                      <CardDescription>
                        {(template.questions as Question[]).length} questions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            Skip for now
          </Button>
        </div>
      </div>
    );
  }

  // Questionnaire Step
  if (step === 'questionnaire' && currentTemplate) {
    const questions = currentTemplate.questions as Question[];
    
    return (
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{currentTemplate.display_name}</h1>
          <p className="text-muted-foreground">
            Answer these questions to help us understand your business better
          </p>
        </div>

        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {index + 1}. {question.question}
                  {question.required && <span className="text-destructive ml-1">*</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {question.type === 'text' && (
                  <Input
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Your answer..."
                  />
                )}

                {question.type === 'number' && (
                  <Input
                    type="number"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
                    placeholder="Enter number..."
                  />
                )}

                {question.type === 'textarea' && (
                  <Textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Your answer..."
                    rows={4}
                  />
                )}

                {question.type === 'select' && question.options && (
                  <Select
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option..." />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {question.type === 'multiselect' && question.options && (
                  <div className="space-y-2">
                    {question.options.map(option => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${question.id}-${option}`}
                          checked={(answers[question.id] || []).includes(option)}
                          onCheckedChange={(checked) => {
                            const current = answers[question.id] || [];
                            const updated = checked
                              ? [...current, option]
                              : current.filter((v: string) => v !== option);
                            handleAnswerChange(question.id, updated);
                          }}
                        />
                        <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={() => setStep('select')}>
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Complete Training'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
```

### 2. Business Insights Dashboard Component

Create `src/components/insights/BusinessInsightsDashboard.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, Users, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BusinessInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  priority: string;
  impact_score: number;
  action_items: string[];
  estimated_effort: string;
  estimated_roi: string;
  status: string;
  created_at: string;
}

const priorityColors = {
  low: 'bg-blue-500/10 text-blue-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  high: 'bg-orange-500/10 text-orange-500',
  critical: 'bg-red-500/10 text-red-500'
};

const insightIcons = {
  seasonal_opportunity: Calendar,
  competitor_gap: Users,
  keyword_opportunity: TrendingUp,
  default: Lightbulb
};

export function BusinessInsightsDashboard() {
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('business_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('impact_score', { ascending: false });

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateInsightStatus = async (insightId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('business_insights')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', insightId);

      if (error) throw error;
      toast.success(`Insight marked as ${status}`);
      loadInsights();
    } catch (error) {
      console.error('Error updating insight:', error);
      toast.error('Failed to update insight');
    }
  };

  if (loading) {
    return <div>Loading insights...</div>;
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Insights Yet</CardTitle>
          <CardDescription>
            Complete your industry profile training to receive personalized insights
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Business Insights</h2>
        <Badge variant="outline">
          {insights.filter(i => i.status === 'pending').length} pending
        </Badge>
      </div>

      {insights.map((insight) => {
        const Icon = insightIcons[insight.insight_type as keyof typeof insightIcons] || insightIcons.default;
        
        return (
          <Card key={insight.id} className={insight.status === 'completed' ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge className={priorityColors[insight.priority as keyof typeof priorityColors]}>
                        {insight.priority}
                      </Badge>
                      <Badge variant="outline">
                        Impact: {insight.impact_score}/100
                      </Badge>
                      {insight.estimated_effort && (
                        <Badge variant="outline">
                          Effort: {insight.estimated_effort}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant={insight.status === 'completed' ? 'default' : 'outline'}>
                  {insight.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{insight.description}</p>

              {insight.action_items && insight.action_items.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Action Items:</h4>
                  <ul className="space-y-1">
                    {insight.action_items.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insight.status !== 'completed' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateInsightStatus(insight.id, 'in_progress')}
                    disabled={insight.status === 'in_progress'}
                  >
                    Start Working
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateInsightStatus(insight.id, 'completed')}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Mark Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateInsightStatus(insight.id, 'dismissed')}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Dismiss
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

### 3. Feature Packages & Credit Packages Display

Create `src/components/pricing/FeaturePackages.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useCreateCheckout } from '@/hooks/useSubscription';
import { toast } from 'sonner';

interface FeaturePackage {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string;
  price_monthly: number;
  category: string;
  features: string[];
  is_active: boolean;
}

interface CreditPackage {
  id: string;
  package_name: string;
  credits: number;
  bonus_credits: number;
  price: number;
  is_popular: boolean;
  is_active: boolean;
}

export function FeaturePackages() {
  const [featurePackages, setFeaturePackages] = useState<FeaturePackage[]>([]);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const { mutate: createCheckout, isPending } = useCreateCheckout();

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const [featuresResult, creditsResult] = await Promise.all([
        supabase.from('feature_packages').select('*').eq('is_active', true),
        supabase.from('credit_packages').select('*').eq('is_active', true).order('price')
      ]);

      if (featuresResult.error) throw featuresResult.error;
      if (creditsResult.error) throw creditsResult.error;

      setFeaturePackages(featuresResult.data || []);
      setCreditPackages(creditsResult.data || []);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleFeaturePurchase = (featureKey: string) => {
    createCheckout({
      purchaseType: 'feature',
      featureKey
    });
  };

  const handleCreditPurchase = (credits: number) => {
    createCheckout({
      purchaseType: 'credits',
      credits
    });
  };

  if (loading) {
    return <div>Loading packages...</div>;
  }

  return (
    <div className="space-y-12">
      {/* Feature Packages */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Individual Feature Packages</h2>
          <p className="text-muted-foreground">
            Add specific features to your plan without upgrading
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featurePackages.map((pkg) => (
            <Card key={pkg.id}>
              <CardHeader>
                <Badge className="w-fit mb-2">{pkg.category}</Badge>
                <CardTitle>{pkg.feature_name}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">${pkg.price_monthly}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full"
                  onClick={() => handleFeaturePurchase(pkg.feature_key)}
                  disabled={isPending}
                >
                  Add to Plan
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Credit Packages */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">One-Time Credit Packs</h2>
          <p className="text-muted-foreground">
            Need more credits? Purchase additional credits anytime
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {creditPackages.map((pkg) => (
            <Card key={pkg.id} className={pkg.is_popular ? 'border-primary' : ''}>
              {pkg.is_popular && (
                <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{pkg.credits.toLocaleString()}</CardTitle>
                <CardDescription>credits</CardDescription>
                {pkg.bonus_credits > 0 && (
                  <Badge variant="secondary" className="mt-2">
                    +{pkg.bonus_credits} bonus
                  </Badge>
                )}
                <div className="mt-4">
                  <span className="text-3xl font-bold">${pkg.price}</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  variant={pkg.is_popular ? 'default' : 'outline'}
                  onClick={() => handleCreditPurchase(pkg.credits)}
                  disabled={isPending}
                >
                  Purchase
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 🔧 Update Existing Files

### Update Stripe Checkout Function

The Stripe checkout function in `supabase/functions/stripe-checkout/index.ts` already supports the three purchase types (subscription, credits, feature). No changes needed there.

### Update useCreditManager Hook

In `src/hooks/useCreditManager.ts`, update the `consumeCredits` function to use the new unlimited check:

```typescript
// Replace the consume function with:
const consumeCredits = async (feature: string, amount: number = 1, metadata?: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('consume_credits_with_unlimited_check', {
    p_user_id: user.id,
    p_feature_name: feature,
    p_credits_amount: amount,
    p_project_id: null,
    p_metadata: metadata || {}
  });

  if (error) throw error;
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to consume credits');
  }

  return data;
};
```

---

## 📱 Add Routes

In `src/App.tsx`, add routes for the new components:

```typescript
import { IndustryProfileWizard } from '@/components/onboarding/IndustryProfileWizard';
import { BusinessInsightsDashboard } from '@/components/insights/BusinessInsightsDashboard';
import { FeaturePackages } from '@/components/pricing/FeaturePackages';

// Add routes:
<Route path="/onboarding/industry-profile" element={<IndustryProfileWizard />} />
<Route path="/insights" element={<BusinessInsightsDashboard />} />
<Route path="/pricing/packages" element={<FeaturePackages />} />
```

---

## ✅ Testing Checklist

- [ ] Deploy both SQL migrations via Supabase dashboard
- [ ] Verify creator account (kasiotisg@gmail.com) has unlimited credits
- [ ] Check that subscription pricing is updated ($29, $79, $149, $299)
- [ ] Test industry profile training wizard
- [ ] Verify business insights are generated
- [ ] Test feature package purchases
- [ ] Test credit package purchases
- [ ] Verify unlimited credits work (no deduction for creator account)
- [ ] Test feature access checks

---

## 🎯 Key Features Summary

### For Regular Users:
1. Complete industry training to get personalized insights
2. Choose from 4 subscription tiers
3. Purchase individual features as needed
4. Buy credit
