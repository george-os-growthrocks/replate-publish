import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message sent!",
      description: "We'll get back to you within 24 hours.",
    });
    
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <>
      <Helmet>
        <title>Contact Us - AnotherSEOGuru</title>
        <meta name="description" content="Get in touch with AnotherSEOGuru. We're here to help with any questions about our SEO platform and AI content generation tools." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            {/* Hero */}
            <div className="max-w-4xl mx-auto text-center mb-20">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Get in{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Touch
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Have a question? We're here to help. Reach out and we'll get back to you within 24 hours.
              </p>
            </div>

            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <div className="rounded-3xl border border-border bg-card p-8">
                  <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Your Name
                      </label>
                      <Input 
                        required 
                        placeholder="John Doe" 
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Email Address
                      </label>
                      <Input 
                        type="email" 
                        required 
                        placeholder="john@company.com" 
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Subject
                      </label>
                      <Input 
                        required 
                        placeholder="How can we help?" 
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Message
                      </label>
                      <Textarea 
                        required 
                        rows={6}
                        placeholder="Tell us more about your question..." 
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full gradient-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-6">
                <div className="rounded-3xl border border-border bg-card p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Email Us</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        Our team typically responds within 24 hours.
                      </p>
                      <a 
                        href="mailto:hello@anotherseoguru.com" 
                        className="text-primary hover:underline"
                      >
                        hello@anotherseoguru.com
                      </a>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-card p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Live Chat</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        Chat with our AI assistant 24/7.
                      </p>
                      <button className="text-primary hover:underline">
                        Start Chat →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-card p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Enterprise Support</h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        For Enterprise customers only.
                      </p>
                      <a 
                        href="tel:+1-555-SEO-GURU" 
                        className="text-primary hover:underline"
                      >
                        +1 (555) SEO-GURU
                      </a>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-card p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Office</h3>
                      <p className="text-muted-foreground text-sm">
                        123 SEO Street<br />
                        Digital City, DC 10001<br />
                        United States
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

