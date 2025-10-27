export interface GscRow {
  date?: string;
  query?: string;
  page?: string;
  country?: string;
  device?: "DESKTOP" | "MOBILE" | "TABLET";
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface QueryToPages {
  query: string;
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  pages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

export interface PageToQueries {
  page: string;
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  queries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

export interface CannibalCluster {
  query: string;
  pages: Array<{
    page: string;
    position: number;
    impressions: number;
    clicks: number;
    ctr: number;
    score: number;
  }>;
  primaryCandidate: string;
  rationale: string;
  totalImpressions: number;
  pageCount: number;
}

export interface CountryData {
  country: string;
  countryName: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  change: number;
}

export interface DeviceData {
  device: "DESKTOP" | "MOBILE" | "TABLET";
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface LinkOpportunity {
  fromPage: string;
  toPage: string;
  sharedQueries: string[];
  suggestedAnchors: string[];
  fromPageClicks: number;
  toPagePosition: number;
}

export interface Alert {
  id: string;
  type: "CTR_DROP" | "POSITION_DROP" | "CLICKS_DROP" | "NEW_OPPORTUNITY";
  severity: "LOW" | "MEDIUM" | "HIGH";
  title: string;
  description: string;
  metric: string;
  change: number;
  affectedItem: string;
  date: string;
}

