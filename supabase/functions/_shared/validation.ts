import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

/**
 * URL validation with SSRF protection
 */
export const safeUrlSchema = z.string().url().refine((url) => {
  try {
    const parsed = new URL(url);
    
    // Block internal networks
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.') ||
      hostname.startsWith('169.254.') ||
      hostname === '0.0.0.0' ||
      hostname === '::1'
    ) {
      return false;
    }
    
    // Only allow http(s)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}, 'Invalid or unsafe URL');

/**
 * Keyword validation
 */
export const keywordSchema = z.string()
  .min(1, 'Keyword cannot be empty')
  .max(500, 'Keyword too long')
  .refine((val) => {
    // Block SQL injection patterns
    const dangerous = /(\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b|;|\-\-|\/\*|\*\/)/i;
    return !dangerous.test(val);
  }, 'Invalid characters in keyword');

/**
 * Location code validation
 */
export const locationSchema = z.string()
  .min(2, 'Location code too short')
  .max(10, 'Location code too long')
  .regex(/^[A-Z0-9]+$/, 'Invalid location code format');

/**
 * Domain validation
 */
export const domainSchema = z.string()
  .min(3, 'Domain too short')
  .max(255, 'Domain too long')
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/, 'Invalid domain format');

/**
 * Content generation validation
 */
export const generateContentSchema = z.object({
  content: z.string().min(1).max(50000, 'Content too large'),
  platforms: z.array(z.enum([
    'seo-blog', 'medium', 'linkedin', 'reddit', 'quora',
    'twitter', 'instagram', 'facebook', 'youtube', 'tiktok', 'newsletter'
  ])).min(1, 'At least one platform required').max(10, 'Too many platforms'),
  tone: z.string().max(50).optional(),
  style: z.string().max(50).optional(),
  seoData: z.object({
    primaryKeyword: z.string().max(200).optional(),
    secondaryKeywords: z.array(z.string().max(200)).max(20).optional(),
    anchors: z.array(z.object({
      anchor: z.string().max(200),
      url: safeUrlSchema
    })).max(50).optional(),
    targetWordCount: z.number().int().min(100).max(10000).optional()
  }).optional()
});

/**
 * DataForSEO research validation
 */
export const dataForSEOSchema = z.object({
  action: z.enum([
    'keyword_research',
    'serp_analysis',
    'competitor_analysis',
    'backlink_analysis'
  ]),
  keyword: keywordSchema.optional(),
  keywords: z.array(keywordSchema).max(100).optional(),
  location: locationSchema.optional(),
  domain: domainSchema.optional(),
  limit: z.number().int().min(1).max(100).optional()
});

/**
 * Scrape URL validation
 */
export const scrapeUrlSchema = z.object({
  url: safeUrlSchema,
  extractContent: z.boolean().optional(),
  followLinks: z.boolean().optional(),
  maxDepth: z.number().int().min(1).max(3).optional()
});

/**
 * Generic pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
});

/**
 * Project ID validation
 */
export const projectIdSchema = z.string().uuid('Invalid project ID');
