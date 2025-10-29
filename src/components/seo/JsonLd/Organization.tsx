import { Helmet } from "react-helmet-async";

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "AnotherSEOGuru",
    "url": "https://anotherseoguru.com",
    "logo": "https://anotherseoguru.com/logo.png",
    "description": "The most advanced SEO platform with AI-powered content generation. Track rankings, analyze competitors, research keywords, and optimize for search.",
    "foundingDate": "2024",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "hello@anotherseoguru.com",
      "contactType": "Customer Service"
    },
    "sameAs": [
      "https://twitter.com/anotherseoguru",
      "https://linkedin.com/company/anotherseoguru",
      "https://github.com/anotherseoguru"
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}

