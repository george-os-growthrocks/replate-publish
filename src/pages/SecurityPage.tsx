import { Helmet } from "react-helmet-async";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { Shield, Lock, Eye, Server, Key, AlertTriangle } from "lucide-react";

export default function SecurityPage() {
  return (
    <>
      <Helmet>
        <title>Security - AnotherSEOGuru</title>
        <meta name="description" content="Learn about AnotherSEOGuru's comprehensive security measures and how we protect your data and privacy." />
        <link rel="canonical" href="https://anotherseoguru.com/security" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <LandingNav />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold mb-6 text-foreground">Security</h1>
              <p className="text-xl text-muted-foreground mb-12">
                Your data security is our top priority. Learn about our comprehensive approach to protecting your information.
              </p>

              <div className="grid gap-8">
                {/* Infrastructure Security */}
                <div className="rounded-xl border border-border bg-card p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Server className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Infrastructure Security</h2>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">Enterprise-Grade Hosting:</strong> Hosted on secure, SOC 2 Type II certified infrastructure</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">DDoS Protection:</strong> Advanced protection against distributed denial-of-service attacks</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">24/7 Monitoring:</strong> Continuous monitoring of all systems and infrastructure</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">Regular Backups:</strong> Automated daily backups with 30-day retention</span>
                    </li>
                  </ul>
                </div>

                {/* Data Encryption */}
                <div className="rounded-xl border border-border bg-card p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Data Encryption</h2>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">In-Transit Encryption:</strong> All data transmitted using TLS 1.3 encryption</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">At-Rest Encryption:</strong> All stored data encrypted using AES-256 encryption</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">Database Encryption:</strong> Encrypted database connections and storage</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">SSL/TLS Certificates:</strong> Valid SSL certificates for all domains</span>
                    </li>
                  </ul>
                </div>

                {/* Access Control */}
                <div className="rounded-xl border border-border bg-card p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Key className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Access Control</h2>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">Multi-Factor Authentication:</strong> Optional 2FA for all user accounts</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">Role-Based Access:</strong> Granular permissions and access control</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">Secure Password Storage:</strong> Bcrypt hashing for all passwords</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">Session Management:</strong> Secure session handling with automatic timeout</span>
                    </li>
                  </ul>
                </div>

                {/* Privacy & Compliance */}
                <div className="rounded-xl border border-border bg-card p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Privacy & Compliance</h2>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">GDPR Compliant:</strong> Full compliance with EU data protection regulations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">SOC 2 Type II:</strong> Certified secure infrastructure and processes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">Data Isolation:</strong> Your data is completely isolated from other customers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">No Data Selling:</strong> We never sell or share your data with third parties</span>
                    </li>
                  </ul>
                </div>

                {/* Security Audits */}
                <div className="rounded-xl border border-border bg-card p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Security Audits & Testing</h2>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">Penetration Testing:</strong> Regular third-party security assessments</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">Vulnerability Scanning:</strong> Automated daily scans for security issues</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">Code Reviews:</strong> Security-focused code reviews for all changes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">Bug Bounty Program:</strong> Rewards for responsible disclosure of vulnerabilities</span>
                    </li>
                  </ul>
                </div>

                {/* Incident Response */}
                <div className="rounded-xl border border-border bg-card p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Incident Response</h2>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">24/7 Security Team:</strong> Dedicated team monitoring for security incidents</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">Incident Response Plan:</strong> Documented procedures for handling security events</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">User Notifications:</strong> Prompt communication in case of data breaches</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                      <span><strong className="text-foreground">Post-Incident Analysis:</strong> Thorough investigation and remediation of all incidents</span>
                    </li>
                  </ul>
                </div>

                {/* Contact */}
                <div className="rounded-xl border-2 border-primary bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
                  <h2 className="text-2xl font-bold mb-4 text-foreground">Report a Security Issue</h2>
                  <p className="text-muted-foreground mb-4">
                    If you discover a security vulnerability, please report it to us immediately. We take all security reports seriously 
                    and will respond within 24 hours.
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Security Email:</strong>{" "}
                    <a href="mailto:security@anotherseoguru.com" className="text-primary hover:underline">
                      security@anotherseoguru.com
                    </a>
                  </p>
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

