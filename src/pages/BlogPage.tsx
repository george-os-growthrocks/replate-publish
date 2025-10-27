import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";

const blogPosts = [
  {
                    slug: "announcing-anotherseoguru-launch",
    title: "Announcing AnotherSEOGuru: The Most Advanced SEO Platform + AI Content Engine",
    excerpt: "We're thrilled to announce the launch of AnotherSEOGuru - a revolutionary SEO platform that combines 25+ powerful SEO tools with cutting-edge AI content generation. Discover how we're democratizing professional SEO for businesses of all sizes.",
    author: "AnotherSEOGuru Team",
    date: "October 27, 2025",
    readTime: "8 min read",
    category: "Product Launch",
    image: "/hero-image.jpg"
  }
];

export default function BlogPage() {
  return (
    <>
      <Helmet>
        <title>SEO Blog - Expert Tips & Updates | AnotherSEOGuru</title>
        <meta 
          name="description" 
          content="Stay updated with the latest SEO trends, tips, and strategies. Learn from experts about keyword research, rank tracking, content optimization, and more." 
        />
        <link rel="canonical" href="https://anotherseoguru.com/blog" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          {/* Hero */}
          <div className="container mx-auto px-4 mb-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
                SEO{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Blog
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Expert insights, tips, and strategies to dominate search rankings
              </p>
            </div>
          </div>

          {/* Blog Posts Grid */}
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post, index) => (
                <Link
                  key={index}
                  to={`/blog/${post.slug}`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                >
                  {/* Featured Image */}
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </div>
                    </div>

                    {/* Read More */}
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

