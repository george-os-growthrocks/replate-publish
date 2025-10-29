import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does AnotherSEOGuru compare to Ahrefs or SEMrush?",
    answer: "AnotherSEOGuru provides all the features of premium SEO tools (keyword research, rank tracking, backlinks, site audits) PLUS AI content generation, AI Overview optimization, and 15+ free SEO tools—all in one unified platform. Most importantly, it costs 70-90% less than managing multiple subscriptions."
  },
  {
    question: "Do I need to connect my Google Search Console?",
    answer: "Yes. AnotherSEOGuru relies on your live Google Search Console data to function. Connecting GSC is required for queries, pages, countries/devices reporting, insights, and recommendations. Without GSC, core features will not work."
  },
  {
    question: "What AI models power the content generation?",
    answer: "AnotherSEOGuru integrates with OpenAI (GPT-4), Anthropic (Claude), Google (Gemini), and Perplexity. Each content piece is optimized using the best model for the platform—whether that's technical SEO analysis from Claude or creative content from GPT-4."
  },
  {
    question: "Can I use the free tools without signing up?",
    answer: "Yes! Many of our free SEO tools work without any account. However, signing up for a free account unlocks higher usage limits, allows you to save results, and gives you access to advanced features. No credit card required for the free tier."
  },
  {
    question: "How accurate is the rank tracking?",
    answer: "Our rank tracking uses real SERP data updated 24/7 for desktop and mobile. We monitor rankings across all device types and provide historical trends, competitor comparisons, and SERP feature detection to give you complete visibility into your search presence."
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "All your historical data (rankings, reports, projects, content) remains accessible for 90 days after cancellation. You can export everything as CSV/JSON at any time. We never delete your data immediately—you have full control over exports."
  },
  {
    question: "Is there a team collaboration feature?",
    answer: "Yes! All paid plans include team collaboration. You can invite team members, assign projects, share reports, and set permissions. Agency plans support unlimited team members, perfect for managing multiple client accounts."
  },
  {
    question: "Do you offer white-label reports?",
    answer: "White-label branded reports are available on Pro and Agency plans. You can customize reports with your logo, colors, and branding before sharing with clients or stakeholders."
  },
];

export function FAQSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Frequently Asked <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Questions</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about AnotherSEOGuru
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border rounded-lg px-6 bg-card"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

