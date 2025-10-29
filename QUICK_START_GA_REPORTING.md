# ⚡ Quick Start: Google Analytics Reporting API v4

## 🚀 5-Minute Setup

### **Step 1: Get OAuth Client ID** (2 minutes)

1. Go to: https://console.developers.google.com/
2. Create project or select existing
3. Enable "Google Analytics Reporting API"
4. Create OAuth 2.0 Client ID:
   - Type: Web application
   - Authorized origins: `http://localhost:5173`
5. Copy Client ID

### **Step 2: Configure App** (1 minute)

```bash
# Add to .env file:
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

```bash
# Restart server
npm run dev
```

### **Step 3: Get View ID** (1 minute)

**Option A**: Google Analytics Admin
- Admin → View Settings → Copy View ID

**Option B**: Account Explorer
- Visit: https://ga-dev-tools.google/account-explorer/
- Copy View ID

### **Step 4: Test** (1 minute)

1. Visit: `http://localhost:5173/ga-reporting`
2. Click "Sign in with Google"
3. Enter View ID
4. Click "Load Report"
5. ✅ See your analytics data!

---

## 📋 What You Get

- ✅ Last 10 days visitor data
- ✅ Daily breakdown
- ✅ Total, average, peak statistics
- ✅ Beautiful modern UI
- ✅ No server required
- ✅ No database required
- ✅ Free (no API costs)

---

## ⚠️ Important Notes

### **Universal Analytics (GA3) Only**
- This uses Reporting API v4 (for GA3)
- If you have GA4 only, use `/analytics-dashboard` instead
- GA3 stopped collecting data July 1, 2023

### **Development vs Production**
- Dev: Works on `localhost:5173`
- Prod: Add your production domain to authorized origins in Google Cloud Console

---

## 🐛 Quick Troubleshooting

**"This app isn't verified"**
→ Click "Advanced" → "Go to app" (normal for dev)

**"Invalid Client ID"**
→ Check `.env` file, restart server

**"No data"**
→ Verify View ID is correct (GA3, not GA4)

**GAPI not loading**
→ Check browser console, disable ad blocker

---

## 📚 Full Documentation

See `GA_REPORTING_API_V4_SETUP.md` for complete setup guide, customization options, and troubleshooting.

---

## 🎯 Routes

- **GA Reporting v4** (Client-side, GA3): `/ga-reporting`
- **GA4 Dashboard** (Server-side, GA4): `/analytics-dashboard`

---

**Ready to go!** 🚀
