import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Copy, Check, ArrowRight, Code2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type SchemaType = "article" | "product" | "local-business" | "faq" | "breadcrumb" | "person" | "organization";

export default function SchemaGenerator() {
  const [schemaType, setSchemaType] = useState<SchemaType>("article");
  const [copied, setCopied] = useState(false);

  // Article fields
  const [articleTitle, setArticleTitle] = useState("");
  const [articleDescription, setArticleDescription] = useState("");
  const [articleAuthor, setArticleAuthor] = useState("");
  const [articleDate, setArticleDate] = useState("");
  const [articleImage, setArticleImage] = useState("");

  // Product fields
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImage, setProductImage] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCurrency, setProductCurrency] = useState("USD");
  const [productRating, setProductRating] = useState("");

  // Local Business fields
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessType, setBusinessType] = useState("Restaurant");

  const generateSchema = () => {
    let schema: any = {};

    switch (schemaType) {
      case "article":
        schema = {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": articleTitle,
          "description": articleDescription,
          "author": {
            "@type": "Person",
            "name": articleAuthor
          },
          "datePublished": articleDate,
          "image": articleImage
        };
        break;

      case "product":
        schema = {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": productName,
          "description": productDescription,
          "image": productImage,
          "offers": {
            "@type": "Offer",
            "price": productPrice,
            "priceCurrency": productCurrency
          },
          "aggregateRating": productRating ? {
            "@type": "AggregateRating",
            "ratingValue": productRating,
            "reviewCount": "100"
          } : undefined
        };
        break;

      case "local-business":
        schema = {
          "@context": "https://schema.org",
          "@type": businessType,
          "name": businessName,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": businessAddress
          },
          "telephone": businessPhone
        };
        break;

      case "faq":
        schema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Your first question?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Your answer here"
              }
            }
          ]
        };
        break;

      case "breadcrumb":
        schema = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://example.com"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Category",
              "item": "https://example.com/category"
            }
          ]
        };
        break;

      case "person":
        schema = {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": "Person Name",
          "url": "https://example.com",
          "sameAs": [
            "https://twitter.com/username",
            "https://linkedin.com/in/username"
          ]
        };
        break;

      case "organization":
        schema = {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Organization Name",
          "url": "https://example.com",
          "logo": "https://example.com/logo.png",
          "sameAs": [
            "https://facebook.com/page",
            "https://twitter.com/account"
          ]
        };
        break;
    }

    return JSON.stringify(schema, null, 2);
  };

  const schemaCode = generateSchema();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`<script type="application/ld+json">\n${schemaCode}\n</script>`);
    setCopied(true);
    toast.success("Schema markup copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const siteUrl = "https://anotherseoguru.com";
  const pageUrl = `${siteUrl}/free-tools/schema-generator`;

  return (
    <>
      <Helmet>
        <title>Free Schema Markup Generator - JSON-LD Generator for SEO | AnotherSEOGuru</title>
        <meta
          name="description"
          content="Generate Schema.org JSON-LD structured data for better SEO. Create schema markup for articles, products, local businesses, FAQs, and more. Free tool."
        />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Free Schema Markup Generator - Boost SEO with Structured Data" />
        <meta property="og:description" content="Create perfect Schema.org markup in seconds. Support for all major schema types." />
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
                Free <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Schema Markup Generator</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Generate perfect Schema.org JSON-LD structured data for better SEO and rich snippets. Support for articles, products, local businesses, and more.
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Schema Type Selector & Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-primary" />
                      Schema Configuration
                    </CardTitle>
                    <CardDescription>
                      Choose schema type and fill in details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Schema Type
                      </label>
                      <Select value={schemaType} onValueChange={(value) => setSchemaType(value as SchemaType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="local-business">Local Business</SelectItem>
                          <SelectItem value="faq">FAQ</SelectItem>
                          <SelectItem value="breadcrumb">Breadcrumb</SelectItem>
                          <SelectItem value="person">Person</SelectItem>
                          <SelectItem value="organization">Organization</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Article Fields */}
                    {schemaType === "article" && (
                      <>
                        <Input placeholder="Article Title" value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} />
                        <Textarea placeholder="Article Description" value={articleDescription} onChange={(e) => setArticleDescription(e.target.value)} rows={3} />
                        <Input placeholder="Author Name" value={articleAuthor} onChange={(e) => setArticleAuthor(e.target.value)} />
                        <Input type="date" value={articleDate} onChange={(e) => setArticleDate(e.target.value)} />
                        <Input placeholder="Image URL" value={articleImage} onChange={(e) => setArticleImage(e.target.value)} />
                      </>
                    )}

                    {/* Product Fields */}
                    {schemaType === "product" && (
                      <>
                        <Input placeholder="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} />
                        <Textarea placeholder="Product Description" value={productDescription} onChange={(e) => setProductDescription(e.target.value)} rows={3} />
                        <Input placeholder="Image URL" value={productImage} onChange={(e) => setProductImage(e.target.value)} />
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Price" type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} />
                          <Select value={productCurrency} onValueChange={setProductCurrency}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Input placeholder="Rating (1-5)" type="number" min="1" max="5" step="0.1" value={productRating} onChange={(e) => setProductRating(e.target.value)} />
                      </>
                    )}

                    {/* Local Business Fields */}
                    {schemaType === "local-business" && (
                      <>
                        <Input placeholder="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                        <Select value={businessType} onValueChange={setBusinessType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Restaurant">Restaurant</SelectItem>
                            <SelectItem value="Hotel">Hotel</SelectItem>
                            <SelectItem value="Store">Store</SelectItem>
                            <SelectItem value="LocalBusiness">Local Business</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="Address" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />
                        <Input placeholder="Phone Number" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} />
                      </>
                    )}

                    {schemaType === "faq" && (
                      <p className="text-sm text-muted-foreground">
                        FAQ schema template generated. Edit the JSON manually to add your questions and answers.
                      </p>
                    )}

                    {schemaType === "breadcrumb" && (
                      <p className="text-sm text-muted-foreground">
                        Breadcrumb schema template generated. Edit the JSON to match your site structure.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Generated Schema */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Generated Schema</CardTitle>
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        size="sm"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2 text-success" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Code
                          </>
                        )}
                      </Button>
                    </div>
                    <CardDescription>
                      Paste this code in your page &lt;head&gt;
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono overflow-x-auto">
                        {`<script type="application/ld+json">\n${schemaCode}\n</script>`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Schema Types Info */}
              <Card className="mb-12">
                <CardHeader>
                  <CardTitle>Schema Types Explained</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-foreground">📰 Article</h4>
                      <p className="text-sm text-muted-foreground">
                        For blog posts and news articles. Helps Google show rich snippets with author, date, and image.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-foreground">🛍️ Product</h4>
                      <p className="text-sm text-muted-foreground">
                        For e-commerce products. Shows price, rating, and availability in search results.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-foreground">🏪 Local Business</h4>
                      <p className="text-sm text-muted-foreground">
                        For physical businesses. Displays address, phone, and business hours in Google Maps and Search.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-foreground">❓ FAQ</h4>
                      <p className="text-sm text-muted-foreground">
                        For FAQ pages. Google can show expandable Q&A directly in search results.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-foreground">🍞 Breadcrumb</h4>
                      <p className="text-sm text-muted-foreground">
                        Shows site hierarchy in search results instead of plain URLs.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-foreground">👤 Person/Organization</h4>
                      <p className="text-sm text-muted-foreground">
                        For personal brands or companies. Links social profiles in knowledge graph.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <CardContent className="pt-6 text-center">
                  <h3 className="text-2xl font-bold mb-3 text-foreground">
                    Need Automatic Schema Implementation?
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                    Get automatic schema markup generation and validation with AnotherSEOGuru's technical SEO suite.
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

