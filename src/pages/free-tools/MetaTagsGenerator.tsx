import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Check, ArrowRight, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function MetaTagsGenerator() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [siteName, setSiteName] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [copied, setCopied] = useState(false);

  const generateMetaTags = () => {
    const tags: string[] = [];

    // Basic Meta Tags
    if (title) {
      tags.push(`<title>${title}</title>`);
      tags.push(`<meta name="title" content="${title}">`);
    }
    if (description) {
      tags.push(`<meta name="description" content="${description}">`);
    }

    // Open Graph Tags
    if (title) tags.push(`<meta property="og:title" content="${title}">`);
    if (description) tags.push(`<meta property="og:description" content="${description}">`);
    if (url) tags.push(`<meta property="og:url" content="${url}">`);
    if (imageUrl) tags.push(`<meta property="og:image" content="${imageUrl}">`);
    if (siteName) tags.push(`<meta property="og:site_name" content="${siteName}">`);
    tags.push(`<meta property="og:type" content="website">`);

    // Twitter Card Tags
    tags.push(`<meta name="twitter:card" content="summary_large_image">`);
    if (title) tags.push(`<meta name="twitter:title" content="${title}">`);
    if (description) tags.push(`<meta name="twitter:description" content="${description}">`);
    if (imageUrl) tags.push(`<meta name="twitter:image" content="${imageUrl}">`);
    if (twitterHandle) tags.push(`<meta name="twitter:site" content="@${twitterHandle.replace('@', '')}">`);

    return tags.join('\n');
  };

  const metaTags = generateMetaTags();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(metaTags);
    setCopied(true);
    toast.success("Meta tags copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const titleLength = title.length;
  const descLength = description.length;

  return (
    <>
      <Helmet>
        <title>Free Meta Tags Generator - Create SEO Meta Tags Instantly | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="Generate perfect meta tags for SEO in seconds. Create title tags, meta descriptions, Open Graph tags, and Twitter Cards. Free tool, no signup required." 
        />
        <link rel="canonical" href="https://anotherseoguru.com/free-tools/meta-tags-generator" />
        <meta property="og:title" content="Free Meta Tags Generator - Perfect SEO Tags in Seconds" />
        <meta property="og:description" content="Create optimized meta tags for better SEO and social sharing. Free tool with live preview." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            {/* Hero */}
            <div className="max-w-4xl mx-auto text-center mb-12">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="w-3 h-3 mr-1" />
                Free Tool - No Signup Required
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight">
                Free <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Meta Tags Generator</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Create perfect meta tags for SEO and social media sharing. Generate title tags, meta descriptions, Open Graph tags, and Twitter Cards instantly.
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              {/* SERP Preview */}
              {(title || description) && (
                <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Live SERP Preview
                    </CardTitle>
                    <CardDescription>How your page will appear in Google search results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-background rounded-lg p-6 border border-border">
                      {/* Desktop SERP */}
                      <div className="mb-6">
                        <p className="text-xs text-muted-foreground mb-3 font-semibold">DESKTOP</p>
                        <div className="space-y-1">
                          <div className="flex items-start gap-2">
                            {imageUrl && (
                              <img src={imageUrl} alt="Preview" className="w-16 h-16 rounded object-cover flex-shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            )}
                            <div className="flex-grow">
                              <div className="flex items-center gap-2 mb-1">
                                {siteName && <span className="text-sm text-muted-foreground">{siteName}</span>}
                                {url && <span className="text-xs text-muted-foreground">• {new URL(url).hostname}</span>}
                              </div>
                              <h3 className="text-xl text-blue-600 hover:underline cursor-pointer line-clamp-2 mb-1">
                                {title || "Your Page Title Will Appear Here"}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {description || "Your meta description will appear here. Make it compelling to improve click-through rates."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile SERP */}
                      <div className="pt-6 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-3 font-semibold">MOBILE</p>
                        <div className="max-w-sm">
                          <div className="flex items-center gap-2 mb-1">
                            {siteName && <span className="text-xs text-muted-foreground truncate">{siteName}</span>}
                          </div>
                          <h3 className="text-base text-blue-600 line-clamp-2 mb-1">
                            {title || "Your Page Title"}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {description || "Your meta description will appear here."}
                          </p>
                        </div>
                      </div>

                      {/* Validation Warnings */}
                      <div className="mt-6 pt-6 border-t border-border space-y-2">
                        {titleLength === 0 && (
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <span className="w-2 h-2 bg-destructive rounded-full"></span>
                            <span>Missing title tag - This is critical for SEO!</span>
                          </div>
                        )}
                        {titleLength > 0 && titleLength < 30 && (
                          <div className="flex items-center gap-2 text-sm text-yellow-600">
                            <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                            <span>Title is too short (under 30 chars) - Add more details</span>
                          </div>
                        )}
                        {titleLength > 60 && (
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <span className="w-2 h-2 bg-destructive rounded-full"></span>
                            <span>Title will be cut off in search results ({titleLength} chars) - Keep under 60!</span>
                          </div>
                        )}
                        {titleLength >= 50 && titleLength <= 60 && (
                          <div className="flex items-center gap-2 text-sm text-success">
                            <span className="w-2 h-2 bg-success rounded-full"></span>
                            <span>Perfect title length! ({titleLength} chars)</span>
                          </div>
                        )}
                        
                        {descLength === 0 && (
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <span className="w-2 h-2 bg-destructive rounded-full"></span>
                            <span>Missing meta description - Google will generate one automatically</span>
                          </div>
                        )}
                        {descLength > 0 && descLength < 120 && (
                          <div className="flex items-center gap-2 text-sm text-yellow-600">
                            <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                            <span>Description is too short ({descLength} chars) - Aim for 150-160 chars</span>
                          </div>
                        )}
                        {descLength > 160 && (
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <span className="w-2 h-2 bg-destructive rounded-full"></span>
                            <span>Description will be truncated ({descLength} chars) - Keep under 160!</span>
                          </div>
                        )}
                        {descLength >= 150 && descLength <= 160 && (
                          <div className="flex items-center gap-2 text-sm text-success">
                            <span className="w-2 h-2 bg-success rounded-full"></span>
                            <span>Perfect description length! ({descLength} chars)</span>
                          </div>
                        )}

                        {titleLength >= 50 && titleLength <= 60 && descLength >= 150 && descLength <= 160 && (
                          <div className="flex items-center gap-2 text-sm text-success font-semibold mt-4 p-3 bg-success/10 rounded-lg border border-success/20">
                            <Check className="w-5 h-5" />
                            <span>🎉 Perfect! Your meta tags are optimized for maximum CTR!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* Input Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Page Information
                    </CardTitle>
                    <CardDescription>
                      Enter your page details to generate meta tags
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Page Title *
                      </label>
                      <Input
                        placeholder="Best SEO Tools for 2025"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={70}
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">Recommended: 50-60 characters</span>
                        <Badge variant={titleLength > 60 ? "destructive" : titleLength > 50 ? "secondary" : "outline"} className="text-xs">
                          {titleLength}/70
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Meta Description *
                      </label>
                      <Textarea
                        placeholder="Discover the top SEO tools to boost your rankings in 2025. Compare features, pricing, and reviews of the best SEO software."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={160}
                        rows={3}
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">Recommended: 150-160 characters</span>
                        <Badge variant={descLength > 160 ? "destructive" : descLength > 150 ? "secondary" : "outline"} className="text-xs">
                          {descLength}/160
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Page URL
                      </label>
                      <Input
                        placeholder="https://example.com/page"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Image URL (for social sharing)
                      </label>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                      <span className="text-xs text-muted-foreground">Recommended: 1200x630px</span>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Site Name
                      </label>
                      <Input
                        placeholder="Your Website Name"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Twitter Handle
                      </label>
                      <Input
                        placeholder="@yourusername"
                        value={twitterHandle}
                        onChange={(e) => setTwitterHandle(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Generated Tags */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Generated Meta Tags</CardTitle>
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        size="sm"
                        disabled={!title && !description}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2 text-success" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Tags
                          </>
                        )}
                      </Button>
                    </div>
                    <CardDescription>
                      Copy and paste these into your HTML &lt;head&gt;
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {metaTags ? (
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono overflow-x-auto">
                          {metaTags}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Fill in the form to generate meta tags</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Best Practices */}
              <Card className="mb-12">
                <CardHeader>
                  <CardTitle>Meta Tags Best Practices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-foreground">📝 Title Tag Tips</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Keep it under 60 characters</li>
                        <li>• Include your primary keyword</li>
                        <li>• Make it compelling and clickable</li>
                        <li>• Include your brand name</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-foreground">📄 Meta Description Tips</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Aim for 150-160 characters</li>
                        <li>• Include a call-to-action</li>
                        <li>• Use active voice</li>
                        <li>• Match search intent</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-foreground">🖼️ Open Graph Tips</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Use 1200x630px images</li>
                        <li>• Test with Facebook debugger</li>
                        <li>• Keep text readable on mobile</li>
                        <li>• Use high-quality images</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-foreground">🐦 Twitter Card Tips</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Use summary_large_image for best results</li>
                        <li>• Test with Twitter Card Validator</li>
                        <li>• Include @handle for attribution</li>
                        <li>• Optimize for mobile viewing</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <CardContent className="pt-6 text-center">
                  <h3 className="text-2xl font-bold mb-3 text-foreground">
                    Need Advanced SEO Tools?
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                    Get automatic meta tag optimization, A/B testing, and real-time performance tracking with AnotherSEOGuru.
                  </p>
                  <Button asChild size="lg" className="gradient-primary">
                    <Link to="/auth">
                      Start Free 7-Day Trial
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

