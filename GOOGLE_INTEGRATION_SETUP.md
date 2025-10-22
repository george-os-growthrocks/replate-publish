# 🔐 Google Integration Setup Guide

## Overview
This guide will help you configure Google Search Console and Google Analytics 4 integration for **AnotherSEOGuru**.

---

## 📋 Prerequisites
1. A Google Cloud Platform account
2. Access to Google Search Console
3. Access to Google Analytics 4

---

## 🛠️ Step 1: Google Cloud Console Setup

### 1.1 Create/Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

### 1.2 Enable Required APIs
Enable the following APIs:
- **Google Search Console API**
- **Google Analytics Data API**

Navigate to: **APIs & Services > Library** and search for each API to enable them.

### 1.3 Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** as User Type
3. Fill in the required fields:
   - App name: `AnotherSEOGuru`
   - User support email: Your email
   - Developer contact: Your email
4. Add the following scopes:
   ```
   https://www.googleapis.com/auth/webmasters.readonly
   https://www.googleapis.com/auth/analytics.readonly
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   openid
   ```
5. Add test users (your email and any other testers)

### 1.4 Create OAuth 2.0 Credentials
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials** > **OAuth Client ID**
3. Choose **Web application**
4. Configure the OAuth client:

   **Authorized JavaScript origins:**
   ```
   https://anotherseoguru.com
   http://localhost:5173
   http://localhost:3000
   ```

   **Authorized redirect URIs:**
   ```
   https://anotherseoguru.com/google-oauth-callback.html
   http://localhost:5173/google-oauth-callback.html
   ```

5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

---

## 🔑 Step 2: Configure Lovable Cloud Secrets

The Google OAuth credentials have already been added to your Lovable Cloud secrets:
- ✅ `GOOGLE_OAUTH_CLIENT_ID` - Configured
- ✅ `GOOGLE_OAUTH_CLIENT_SECRET` - Configured

The frontend OAuth client ID is configured in your environment as `VITE_GOOGLE_OAUTH_CLIENT_ID`.

---

## 📊 Step 3: Using the Integration

### 3.1 Connect Google Account
1. Navigate to **SEO Dashboard** in your app
2. Go to **Google Integrations** section
3. Click **Connect Google Account**
4. Authorize the required permissions
5. Select your Google Search Console property
6. Select your Google Analytics 4 property
7. Click **Save Property Selections**

### 3.2 Sync Data
Once connected, you can:
- **Sync GSC Data**: Fetches search performance, keywords, clicks, impressions
- **Sync GA4 Data**: Fetches user analytics, sessions, page views, conversions

Data is stored in your Supabase database tables:
- `gsc_analytics` - Search Console data
- `ga4_analytics` - Analytics data
- `google_api_settings` - OAuth tokens and property settings

---

## 🔄 Data Sync Architecture

### OAuth Flow
```
User → Google OAuth → Callback → Edge Function → Store Tokens → Fetch Properties
```

### Data Fetching
```
Frontend → Edge Function → Google API → Parse & Store → Supabase Database
```

### Token Refresh
Tokens are automatically refreshed when expired using the stored refresh token.

---

## 📁 Key Files

### Backend (Edge Functions)
- `supabase/functions/google-oauth-callback/index.ts` - Handles OAuth token exchange
- `supabase/functions/fetch-gsc-data/index.ts` - Fetches Search Console data
- `supabase/functions/fetch-ga4-data/index.ts` - Fetches Analytics data

### Frontend (React Components)
- `src/components/seo/GoogleIntegrationsMinimal.tsx` - Main integration UI
- `src/components/seo/GooglePropertySelector.tsx` - OAuth flow & property selection

### Configuration
- `public/google-oauth-callback.html` - OAuth popup callback handler
- `.env` - Environment variables (auto-configured)

---

## 🔒 Security Notes

1. **Secrets Management**: OAuth credentials are stored securely in Lovable Cloud secrets
2. **Token Storage**: Access and refresh tokens are encrypted in Supabase
3. **RLS Policies**: All data access is protected by Row Level Security
4. **Scopes**: Only readonly access to Search Console and Analytics

---

## 📈 Data Limits & Pagination

### Google Search Console
- API Limit: 25,000 rows per request
- Implementation: Automatic pagination to fetch all available data
- Storage: All keywords and pages are stored with metrics

### Google Analytics 4
- API Limit: 10,000 rows per request
- Implementation: Batched requests for comprehensive data
- Storage: Page paths, channels, and all metrics

---

## 🐛 Troubleshooting

### "OAuth credentials not configured" Error
- Verify `VITE_GOOGLE_OAUTH_CLIENT_ID` is set in your environment
- Check that secrets are properly configured in Lovable Cloud

### "Permission denied" Error
- Ensure all required scopes are added to OAuth consent screen
- Verify the user has access to the selected GSC/GA4 properties
- Check that APIs are enabled in Google Cloud Console

### "Invalid redirect URI" Error
- Verify redirect URIs in Google Cloud Console match exactly:
  - `https://your-domain.com/google-oauth-callback.html`
  - `http://localhost:5173/google-oauth-callback.html`

### "Token expired" Error
- Tokens are automatically refreshed
- If persistent, disconnect and reconnect your Google account

---

## ✅ Deployment Checklist

- [x] Google Cloud Project created
- [x] APIs enabled (Search Console, Analytics Data)
- [x] OAuth consent screen configured
- [x] OAuth client credentials created
- [x] Lovable Cloud secrets configured
- [x] Redirect URIs properly set
- [x] Test OAuth flow in development
- [x] Update production redirect URIs
- [x] Test data sync functionality

---

## 🚀 Next Steps

1. Deploy your app to production
2. Add production domain to authorized origins in Google Cloud Console
3. Add production callback URL: `https://your-domain.com/google-oauth-callback.html`
4. Set up automated data sync (optional: use Supabase Cron)
5. Build dashboard visualizations using the synced data

---

## 📞 Support

For issues with:
- **Google OAuth**: Check Google Cloud Console logs
- **Lovable Cloud**: Contact support@lovable.dev
- **Edge Functions**: Check Supabase function logs in Lovable Cloud dashboard

---

## 🎯 Current Implementation Status

✅ **Completed:**
- OAuth authentication flow
- Token management & refresh
- GSC data fetching (with pagination)
- GA4 data fetching
- Property selection UI
- Data storage in Supabase
- RLS security policies
- Error handling

🚧 **Ready for Enhancement:**
- Automated scheduled syncs (Supabase Cron)
- Advanced data visualizations
- Export functionality
- Historical data comparison
- Multi-project support
