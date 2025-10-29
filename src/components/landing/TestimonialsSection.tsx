import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "SEO Director",
    company: "TechScale Inc.",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    rating: 5,
    text: "We saved $400/month switching from Ahrefs + SurferSEO to AnotherSEOGuru. The AI content features are game-changing, and having everything in one place streamlined our workflow dramatically.",
    results: "47% faster content production, 23% CTR improvement"
  },
  {
    name: "Marcus Rodriguez",
    role: "Founder",
    company: "Growth Labs",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    rating: 5,
    text: "The AI Overview optimization features put us ahead of competitors. We're seeing more citations and featured snippets since using this platform. Best investment we made this year.",
    results: "12 top 3 rankings gained in 3 months"
  },
  {
    name: "Jennifer Kim",
    role: "Content Manager",
    company: "Digital First Agency",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer",
    rating: 5,
    text: "As an agency managing 20+ clients, AnotherSEOGuru's unified dashboard is a lifesaver. We track all client rankings, generate content, and run audits from one place. The ROI speaks for itself.",
    results: "90% cost reduction, 5 hours saved daily"
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-32 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Loved by <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">SEO Professionals</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what real users are saying about their results with AnotherSEOGuru
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-primary/30 mb-4" />
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-success font-medium mt-2">
                    ✓ {testimonial.results}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

