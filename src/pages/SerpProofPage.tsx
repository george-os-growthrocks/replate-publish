import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SeoTestingMVP } from '@/components/seoproof';

export default function SerpProofPage() {
  return (
    <>
      <Helmet>
        <title>SERPProof - SEO Testing & Experimentation | AnotherSEOGuru</title>
        <meta name="description" content="Run SEO experiments and A/B tests on your Google Search Console data. Time-based tests, split testing, and CTR opportunities analysis." />
        <link rel="canonical" href="https://anotherseoguru.com/serp-proof" />
      </Helmet>

      <SeoTestingMVP />
    </>
  );
}
