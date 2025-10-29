import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";

export default function CookiesPage() {
  return (
    <>
      <Helmet>
        <title>Cookie Policy - AnotherSEOGuru</title>
        <meta name="description" content="Learn about how AnotherSEOGuru uses cookies to improve your experience and provide personalized services." />
        <link rel="canonical" href="https://anotherseoguru.com/cookies" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold mb-6 text-foreground">Cookie Policy</h1>
              <p className="text-muted-foreground mb-8">Last updated: October 27, 2025</p>

              <div className="prose prose-lg dark:prose-invert prose-headings:text-foreground max-w-none space-y-8">
                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">1. What Are Cookies</h2>
                  <p className="text-muted-foreground">
                    Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">2. How We Use Cookies</h2>
                  <p className="text-muted-foreground mb-4">We use cookies for the following purposes:</p>
                  
                  <h3 className="text-xl font-semibold mb-3 text-foreground">2.1 Essential Cookies</h3>
                  <p className="text-muted-foreground mb-4">
                    These cookies are necessary for the website to function properly. They enable core functionality such as security, authentication, and preferences.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-foreground">2.2 Analytics Cookies</h3>
                  <p className="text-muted-foreground mb-4">
                    We use Google Analytics to understand how visitors interact with our website. This helps us improve our services and user experience.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-foreground">2.3 Performance Cookies</h3>
                  <p className="text-muted-foreground mb-4">
                    These cookies help us understand website performance and identify areas for improvement.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">3. Third-Party Cookies</h2>
                  <p className="text-muted-foreground mb-4">
                    We use services from third parties that may set cookies on your device:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Google Analytics for website analytics</li>
                    <li>Google Search Console for SEO data</li>
                    <li>Supabase for authentication and database services</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">4. Managing Cookies</h2>
                  <p className="text-muted-foreground mb-4">
                    You can control and manage cookies in your browser settings. Most browsers allow you to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>See what cookies are stored and delete them individually</li>
                    <li>Block third-party cookies</li>
                    <li>Block all cookies</li>
                    <li>Delete all cookies when you close your browser</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    Please note that blocking or deleting cookies may impact your experience on our website and prevent you from using certain features.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">5. Cookie Duration</h2>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Session Cookies:</strong> These are temporary and are deleted when you close your browser.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    <strong className="text-foreground">Persistent Cookies:</strong> These remain on your device for a set period or until you delete them manually.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">6. Your Consent</h2>
                  <p className="text-muted-foreground">
                    By using our website, you consent to our use of cookies as described in this policy. If you do not agree with our cookie policy, you should disable cookies in your browser settings or refrain from using our website.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">7. Updates to This Policy</h2>
                  <p className="text-muted-foreground">
                    We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">8. Contact Us</h2>
                  <p className="text-muted-foreground">
                    If you have questions about our Cookie Policy, please contact us at{" "}
                    <a href="mailto:support@anotherseoguru.com" className="text-primary hover:underline">
                      support@anotherseoguru.com
                    </a>
                  </p>
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

