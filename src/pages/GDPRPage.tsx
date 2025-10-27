import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";

export default function GDPRPage() {
  return (
    <>
      <Helmet>
        <title>GDPR Compliance - AnotherSEOGuru</title>
        <meta name="description" content="Learn how AnotherSEOGuru complies with GDPR and respects your data privacy rights." />
        <link rel="canonical" href="https://anotherseoguru.com/gdpr" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold mb-6 text-foreground">GDPR Compliance</h1>
              <p className="text-muted-foreground mb-8">Last updated: October 27, 2025</p>

              <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">1. Overview</h2>
                  <p className="text-muted-foreground">
                    AnotherSEOGuru is committed to protecting your privacy and complying with the General Data Protection Regulation (GDPR). 
                    This page explains how we handle your personal data in accordance with GDPR requirements.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">2. Your Rights Under GDPR</h2>
                  <p className="text-muted-foreground mb-4">As a data subject, you have the following rights:</p>
                  
                  <h3 className="text-xl font-semibold mb-3 text-foreground">2.1 Right to Access</h3>
                  <p className="text-muted-foreground mb-4">
                    You have the right to request a copy of all personal data we hold about you. We will provide this information in a structured, 
                    commonly used, and machine-readable format within 30 days of your request.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-foreground">2.2 Right to Rectification</h3>
                  <p className="text-muted-foreground mb-4">
                    You can request that we correct any inaccurate or incomplete personal data we hold about you.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-foreground">2.3 Right to Erasure ("Right to be Forgotten")</h3>
                  <p className="text-muted-foreground mb-4">
                    You can request that we delete your personal data. We will comply unless we have a legal obligation to retain it.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-foreground">2.4 Right to Restrict Processing</h3>
                  <p className="text-muted-foreground mb-4">
                    You can request that we limit how we process your personal data in certain circumstances.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-foreground">2.5 Right to Data Portability</h3>
                  <p className="text-muted-foreground mb-4">
                    You can request a copy of your data in a portable format to transfer to another service provider.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-foreground">2.6 Right to Object</h3>
                  <p className="text-muted-foreground mb-4">
                    You can object to our processing of your personal data for direct marketing purposes at any time.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 text-foreground">2.7 Rights Related to Automated Decision-Making</h3>
                  <p className="text-muted-foreground">
                    You have the right not to be subject to decisions based solely on automated processing that produce legal effects.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">3. Legal Basis for Processing</h2>
                  <p className="text-muted-foreground mb-4">We process your personal data based on the following legal grounds:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong className="text-foreground">Consent:</strong> You have given explicit consent for specific processing activities</li>
                    <li><strong className="text-foreground">Contract:</strong> Processing is necessary to fulfill our contract with you</li>
                    <li><strong className="text-foreground">Legal Obligation:</strong> We must process your data to comply with legal requirements</li>
                    <li><strong className="text-foreground">Legitimate Interests:</strong> Processing is necessary for our legitimate business interests</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">4. Data We Collect</h2>
                  <p className="text-muted-foreground mb-4">We collect and process the following categories of personal data:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Account information (name, email, profile data)</li>
                    <li>Website and SEO data from connected properties</li>
                    <li>Payment and billing information</li>
                    <li>Usage data and analytics</li>
                    <li>Communication history</li>
                    <li>Technical data (IP address, browser type, device information)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">5. How We Protect Your Data</h2>
                  <p className="text-muted-foreground mb-4">
                    We implement appropriate technical and organizational measures to protect your personal data, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Encryption of data at rest and in transit</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Access controls and authentication mechanisms</li>
                    <li>Regular backups and disaster recovery procedures</li>
                    <li>Employee training on data protection</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">6. Data Retention</h2>
                  <p className="text-muted-foreground">
                    We retain your personal data only for as long as necessary to fulfill the purposes outlined in our Privacy Policy or 
                    as required by law. When data is no longer needed, we securely delete or anonymize it.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">7. International Data Transfers</h2>
                  <p className="text-muted-foreground">
                    If we transfer your personal data outside the European Economic Area (EEA), we ensure appropriate safeguards are in place, 
                    such as Standard Contractual Clauses (SCCs) or adequacy decisions by the European Commission.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">8. How to Exercise Your Rights</h2>
                  <p className="text-muted-foreground mb-4">
                    To exercise any of your GDPR rights, please contact us at:
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Email:</strong>{" "}
                    <a href="mailto:privacy@anotherseoguru.com" className="text-primary hover:underline">
                      privacy@anotherseoguru.com
                    </a>
                  </p>
                  <p className="text-muted-foreground mt-4">
                    We will respond to your request within 30 days. In some cases, we may extend this period by an additional 60 days if your 
                    request is complex.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">9. Right to Lodge a Complaint</h2>
                  <p className="text-muted-foreground">
                    If you believe we have not handled your personal data properly, you have the right to lodge a complaint with your local 
                    supervisory authority or data protection regulator.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 text-foreground">10. Contact Information</h2>
                  <p className="text-muted-foreground">
                    For questions about GDPR compliance or to exercise your rights, contact our Data Protection Officer at{" "}
                    <a href="mailto:dpo@anotherseoguru.com" className="text-primary hover:underline">
                      dpo@anotherseoguru.com
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

