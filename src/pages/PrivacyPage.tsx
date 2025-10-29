import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - AnotherSEOGuru</title>
        <meta name="description" content="AnotherSEOGuru's Privacy Policy. Learn how we collect, use, and protect your personal information." />
        <link rel="canonical" href="https://anotherseoguru.com/privacy" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold mb-6 text-foreground">Privacy Policy</h1>
              <p className="text-muted-foreground mb-8">Last updated: October 27, 2024</p>

              <div className="prose prose-lg dark:prose-invert prose-headings:text-foreground max-w-none space-y-8">
                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">1. Introduction</h2>
                  <p className="text-muted-foreground">
                    Welcome to AnotherSEOGuru ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, store, and protect your information when you use our SEO platform and services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">2. Information We Collect</h2>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">2.1 Information You Provide</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Account information (name, email, password)</li>
                    <li>Payment information (processed securely by third-party payment processors)</li>
                    <li>Website URLs and domains you add to our platform</li>
                    <li>Keywords and search queries you track</li>
                    <li>Support tickets and correspondence</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Automatically Collected Information</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Usage data (features used, time spent, clicks)</li>
                    <li>Device information (browser type, OS, IP address)</li>
                    <li>Cookies and similar tracking technologies</li>
                    <li>Log data (access times, pages viewed, errors)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">3. How We Use Your Information</h2>
                  <p className="text-muted-foreground mb-3">We use your information to:</p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Provide and improve our SEO services</li>
                    <li>Track your website rankings and performance</li>
                    <li>Generate AI-powered content and insights</li>
                    <li>Process payments and manage subscriptions</li>
                    <li>Send service updates and marketing communications (with your consent)</li>
                    <li>Detect and prevent fraud or abuse</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">4. Data Sharing and Disclosure</h2>
                  <p className="text-muted-foreground mb-3">
                    We do not sell your personal information. We may share data with:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Service providers (hosting, analytics, payment processing)</li>
                    <li>SEO data providers (Google Search Console API)</li>
                    <li>Law enforcement when required by law</li>
                    <li>Business partners with your explicit consent</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">5. Data Security</h2>
                  <p className="text-muted-foreground">
                    We implement industry-standard security measures including encryption (SSL/TLS), secure authentication, regular security audits, and access controls. However, no method of transmission over the internet is 100% secure.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">6. Your Rights</h2>
                  <p className="text-muted-foreground mb-3">You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate data</li>
                    <li>Request data deletion</li>
                    <li>Export your data</li>
                    <li>Opt-out of marketing communications</li>
                    <li>Object to data processing</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">7. Cookies</h2>
                  <p className="text-muted-foreground">
                    We use cookies to enhance your experience, analyze usage, and personalize content. You can control cookies through your browser settings.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">8. Data Retention</h2>
                  <p className="text-muted-foreground">
                    We retain your data for as long as your account is active or as needed to provide services. After account deletion, we may retain certain data for legal compliance, dispute resolution, and fraud prevention.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">9. International Transfers</h2>
                  <p className="text-muted-foreground">
                    Your data may be transferred and processed in countries outside your residence. We ensure appropriate safeguards are in place to protect your information.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">10. Children's Privacy</h2>
                  <p className="text-muted-foreground">
                    Our services are not intended for users under 18. We do not knowingly collect data from children.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">11. Changes to This Policy</h2>
                  <p className="text-muted-foreground">
                    We may update this policy periodically. We'll notify you of significant changes via email or platform notifications.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">12. Contact Us</h2>
                  <p className="text-muted-foreground">
                    If you have questions about this Privacy Policy, please contact us at:
                  </p>
                  <ul className="list-none space-y-2 text-muted-foreground mt-3">
                    <li>Email: privacy@anotherseoguru.com</li>
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

