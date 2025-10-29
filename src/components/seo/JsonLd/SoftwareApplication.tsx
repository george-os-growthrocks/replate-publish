import { Helmet } from "react-helmet-async";

interface SoftwareApplicationJsonLdProps {
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem?: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
  aggregateRating?: {
    ratingValue: string;
    reviewCount: string;
  };
}

export function SoftwareApplicationJsonLd({
  name,
  description,
  applicationCategory,
  operatingSystem = "Web Browser",
  offers,
  aggregateRating,
}: SoftwareApplicationJsonLdProps) {
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": name,
    "description": description,
    "applicationCategory": applicationCategory,
    "operatingSystem": operatingSystem,
    "url": `https://anotherseoguru.com${typeof window !== 'undefined' ? window.location.pathname : ''}`,
    "offers": offers ? {
      "@type": "Offer",
      "price": offers.price,
      "priceCurrency": offers.priceCurrency
    } : {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  if (aggregateRating) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": aggregateRating.ratingValue,
      "reviewCount": aggregateRating.reviewCount
    };
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}

