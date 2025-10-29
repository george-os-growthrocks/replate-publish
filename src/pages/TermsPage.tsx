import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service - AnotherSEOGuru</title>
        <meta name="description" content="Terms of Service for AnotherSEOGuru. Read our terms and conditions for using our SEO platform." />
        <link rel="canonical" href="https://anotherseoguru.com/terms" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold mb-6 text-foreground">Terms of Service</h1>
              <p className="text-muted-foreground mb-8">Last updated: October 27, 2024</p>

              <div className="prose prose-lg dark:prose-invert prose-headings:text-foreground max-w-none space-y-8">
                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">1. Acceptance of Terms</h2>
                  <p className="text-muted-foreground">
                    By accessing or using AnotherSEOGuru ("Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">2. Description of Service</h2>
                  <p className="text-muted-foreground">
                    AnotherSEOGuru provides a comprehensive SEO platform including keyword research, SERP tracking, competitor analysis, backlink monitoring, technical audits, AI-powered content generation, and related services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">3. Account Registration</h2>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>You must be 18 years or older to use this Service</li>
                    <li>You must provide accurate and complete information</li>
                    <li>You are responsible for maintaining account security</li>
                    <li>One account per user/business</li>
                    <li>You must notify us immediately of any unauthorized access</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">4. Subscription and Payment</h2>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">4.1 Billing</h3>
                  <p className="text-muted-foreground mb-3">
                    Subscriptions are billed monthly or annually in advance. You authorize us to charge your payment method for all fees incurred.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-foreground">4.2 Free Trial</h3>
                  <p className="text-muted-foreground mb-3">
                    We offer a 7-day free trial. After the trial, you will be automatically charged unless you cancel.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-foreground">4.3 Refund Policy</h3>
                  <p className="text-muted-foreground">
                    We offer a 7-day money-back guarantee from your initial purchase date. Contact us for a refund within this period.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">5. Acceptable Use</h2>
                  <p className="text-muted-foreground mb-3">You agree NOT to:</p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Use the Service for illegal purposes</li>
                    <li>Attempt to gain unauthorized access to systems</li>
                    <li>Scrape or harvest data without permission</li>
                    <li>Share your account with others</li>
                    <li>Reverse engineer or copy the Service</li>
                    <li>Use the Service to spam or harass</li>
                    <li>Overload or disrupt our infrastructure</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">6. Data and Privacy</h2>
                  <p className="text-muted-foreground">
                    Your use of the Service is also governed by our Privacy Policy. We collect and use data as described in that policy.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">7. Intellectual Property</h2>
                  <p className="text-muted-foreground">
                    The Service, including all content, features, and functionality, is owned by AnotherSEOGuru and protected by copyright, trademark, and other laws. You retain ownership of data you provide.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">8. Service Availability</h2>
                  <p className="text-muted-foreground">
                    We strive for 99.9% uptime but do not guarantee uninterrupted access. We may perform maintenance, updates, or experience outages.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">9. Disclaimer of Warranties</h2>
                  <p className="text-muted-foreground">
                    THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee specific SEO results or rankings.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">10. Limitation of Liability</h2>
                  <p className="text-muted-foreground">
                    We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">11. Termination</h2>
                  <p className="text-muted-foreground">
                    We may terminate or suspend your account immediately, without notice, for conduct that violates these Terms. You may cancel your subscription at any time.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">12. Changes to Terms</h2>
                  <p className="text-muted-foreground">
                    We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">13. Governing Law</h2>
                  <p className="text-muted-foreground">
                    These Terms shall be governed by the laws of the United States, without regard to conflict of law provisions.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">14. Contact Information</h2>
                  <p className="text-muted-foreground">
                    For questions about these Terms, please contact:
                  </p>
                  <ul className="list-none space-y-2 text-muted-foreground mt-3">
                    <li>Email: legal@anotherseoguru.com</li>
                    <li>Address: 123 SEO Street, Digital City, DC 10001</li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

