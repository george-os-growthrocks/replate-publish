import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Plus, Trash2, Copy, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { RelatedToolsSection } from "@/components/free-tools/RelatedToolsSection";
import { getRelatedTools } from "@/lib/free-tools-data";

interface HreflangTag {
  locale: string;
  url: string;
}

const commonLocales = [
  { value: "en", label: "English (Global)" },
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "es", label: "Spanish (Global)" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "es-MX", label: "Spanish (Mexico)" },
  { value: "fr", label: "French (Global)" },
  { value: "fr-FR", label: "French (France)" },
  { value: "de", label: "German (Germany)" },
  { value: "it", label: "Italian (Italy)" },
  { value: "pt", label: "Portuguese (Global)" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese (Simplified)" },
  { value: "x-default", label: "Default (Fallback)" },
];

export default function HreflangBuilder() {
  const [tags, setTags] = useState<HreflangTag[]>([
    { locale: "en", url: "" },
  ]);
  const [canonical, setCanonical] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleAddTag = () => {
    setTags([...tags, { locale: "en", url: "" }]);
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleUpdateTag = (index: number, field: keyof HreflangTag, value: string) => {
    const newTags = [...tags];
    newTags[index][field] = value;
    setTags(newTags);
  };

  const validateTags = (): boolean => {
    const errors: string[] = [];

    // Check for duplicate locales
    const locales = tags.map(t => t.locale);
    const duplicates = locales.filter((locale, index) => locales.indexOf(locale) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate locales found: ${[...new Set(duplicates)].join(', ')}`);
    }

    // Check for empty URLs
    const emptyUrls = tags.filter(t => !t.url.trim());
    if (emptyUrls.length > 0) {
      errors.push(`${emptyUrls.length} tag(s) have empty URLs`);
    }

    // Check for x-default
    const hasDefault = tags.some(t => t.locale === 'x-default');
    if (!hasDefault) {
      errors.push('Missing x-default tag (recommended for international sites)');
    }

    // Check canonical parity
    if (canonical) {
      const selfReferencingTags = tags.filter(t => t.url === canonical);
      if (selfReferencingTags.length === 0) {
        errors.push('None of the hreflang URLs match the canonical URL');
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const generateCode = () => {
    const code = tags
      .filter(t => t.url.trim())
      .map(t => `<link rel="alternate" hreflang="${t.locale}" href="${t.url}" />`)
      .join('\n');

    return code;
  };

  const handleCopyCode = () => {
    const code = generateCode();
    navigator.clipboard.writeText(code);
    toast.success("Hreflang tags copied to clipboard!");
  };

  return (
    <>
      <Helmet>
        <title>Hreflang Tag Builder & Validator - Free SEO Tool | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="Generate and validate hreflang tags for international SEO. Prevent indexing issues with x-default support and canonical parity checks." 
        />
        <link rel="canonical" href="https://anotherseoguru.com/free-tools/hreflang-builder" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingNav />

        <main className="pt-20">
          {/* Hero */}
          <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <div className="container mx-auto max-w-4xl text-center">
              <Badge className="mb-4" variant="secondary">
                <Sparkles className="w-3 h-3 mr-1" />
                International SEO
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Hreflang Tag Builder & Validator
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Build bulletproof hreflang tags for your international website. No more wrong-country rankings.
              </p>
            </div>
          </section>

          {/* Tool */}
          <section className="py-12 px-4">
            <div className="container mx-auto max-w-5xl">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left: Builder */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Build Your Hreflang Tags</CardTitle>
                      <CardDescription>
                        Add all language/region versions of your page
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Canonical URL */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Canonical URL (Optional)
                        </label>
                        <Input
                          placeholder="https://example.com/page"
                          value={canonical}
                          onChange={(e) => setCanonical(e.target.value)}
                        />
                      </div>

                      {/* Tags */}
                      <div className="space-y-3">
                        {tags.map((tag, index) => (
                          <div key={index} className="flex gap-2">
                            <Select
                              value={tag.locale}
                              onValueChange={(value) => handleUpdateTag(index, 'locale', value)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {commonLocales.map((locale) => (
                                  <SelectItem key={locale.value} value={locale.value}>
                                    {locale.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="https://example.com/page"
                              value={tag.url}
                              onChange={(e) => handleUpdateTag(index, 'url', e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveTag(index)}
                              disabled={tags.length === 1}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button onClick={handleAddTag} variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Language Version
                      </Button>

                      <Button onClick={validateTags} className="w-full gradient-primary">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Validate Tags
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Validation Results */}
                  {validationErrors.length > 0 && (
                    <Card className="border-amber-500/30 bg-amber-500/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                          <AlertCircle className="w-5 h-5" />
                          Validation Issues
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {validationErrors.map((error, idx) => (
                            <li key={idx} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                              <span>•</span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {validationErrors.length === 0 && tags.some(t => t.url) && (
                    <Card className="border-green-500/30 bg-green-500/5">
                      <CardContent className="p-6 flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-green-700 dark:text-green-400">All checks passed!</p>
                          <p className="text-sm text-green-600 dark:text-green-500">Your hreflang implementation looks good.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right: Generated Code */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Generated Hreflang Tags</CardTitle>
                      <CardDescription>
                        Copy and paste into your HTML {'<head>'} section
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        <pre className="p-4 bg-slate-950 dark:bg-slate-900 text-green-400 rounded-lg overflow-x-auto text-xs font-mono max-h-[500px] overflow-y-auto">
                          {generateCode() || "// Add URLs above to generate tags"}
                        </pre>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute top-2 right-2"
                          onClick={handleCopyCode}
                          disabled={!generateCode()}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Best Practices */}
                  <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Best Practices</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Always include x-default for fallback</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Each page should reference all its language versions</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Use absolute URLs (not relative)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Keep canonical URL consistent with hreflang</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>Test in Google Search Console after deployment</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          <RelatedToolsSection tools={getRelatedTools("hreflang-builder")} />
        </main>

        <Footer />
      </div>
    </>
  );
}

