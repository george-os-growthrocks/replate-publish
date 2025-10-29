// Google Analytics Reporting API v4 utilities
// Based on: https://dev.to/ramonak/how-to-develop-a-custom-google-analytics-dashboard-using-google-analytics-reporting-api-v4-and-react-js-4e6l

interface GoogleUser {
  getBasicProfile: () => {
    getName: () => string;
  };
}

interface GoogleAuth {
  isSignedIn: {
    get: () => boolean;
  };
  currentUser: {
    get: () => GoogleUser;
  };
  signIn: () => Promise<GoogleUser>;
  signOut: () => Promise<void>;
}

interface GAPI {
  auth2: {
    init: (config: { client_id: string; scope: string }) => Promise<GoogleAuth>;
    getAuthInstance: () => GoogleAuth;
  };
  client: {
    request: (config: {
      path: string;
      root: string;
      method: string;
      body: unknown;
    }) => Promise<unknown>;
  };
  signin2: {
    render: (
      elementId: string,
      config: {
        scope: string;
        width: number;
        height: number;
        longtitle: boolean;
        theme: string;
        onsuccess: (user: GoogleUser) => void;
        onfailure: (error: Error) => void;
      }
    ) => void;
  };
  load: (api: string, callback: () => void) => void;
}

declare global {
  interface Window {
    gapi: GAPI;
  }
}

// IMPORTANT: Replace with your actual OAuth 2.0 Client ID
// Get it from: https://console.developers.google.com/apis/credentials
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID_HERE";

// Log Client ID (masked for security)
console.log("Google Client ID loaded:", CLIENT_ID ? CLIENT_ID.substring(0, 20) + "..." : "NOT SET");

/**
 * Initialize GoogleAuth object
 */
const initAuth = () => {
  console.log("Initializing Google Auth with scope: analytics.readonly");
  return window.gapi.auth2.init({
    client_id: CLIENT_ID,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
  });
};

/**
 * Check if user is signed in to Google Analytics
 */
export const checkSignedIn = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    initAuth()
      .then(() => {
        const auth = window.gapi.auth2.getAuthInstance();
        resolve(auth.isSignedIn.get());
      })
      .catch((error: Error) => {
        reject(error);
      });
  });
};

/**
 * Sign in to Google Analytics
 */
export const signIn = (): Promise<GoogleUser> => {
  return new Promise((resolve, reject) => {
    const auth = window.gapi.auth2.getAuthInstance();
    auth
      .signIn()
      .then(() => {
        resolve(auth.currentUser.get());
      })
      .catch((error: Error) => {
        reject(error);
      });
  });
};

/**
 * Sign out from Google Analytics
 */
export const signOut = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const auth = window.gapi.auth2.getAuthInstance();
    auth
      .signOut()
      .then(() => {
        resolve();
      })
      .catch((error: Error) => {
        reject(error);
      });
  });
};

/**
 * Render Google Sign-in button
 */
export const renderButton = (elementId: string) => {
  window.gapi.signin2.render(elementId, {
    scope: "profile email",
    width: 240,
    height: 50,
    longtitle: true,
    theme: "dark",
    onsuccess: onSuccess,
    onfailure: onFailure,
  });
};

const onSuccess = (googleUser: GoogleUser) => {
  console.log("Logged in as: " + googleUser.getBasicProfile().getName());
};

const onFailure = (error: Error) => {
  console.error("Sign-in failed:", error);
};

/**
 * Query Google Analytics Reporting API
 * 
 * @param viewId - Your GA View ID (get from Google Analytics Admin)
 * @param startDate - Start date (e.g., "7daysAgo", "2024-01-01")
 * @param endDate - End date (e.g., "today", "2024-01-31")
 * @param metrics - Array of metrics (e.g., ["ga:users", "ga:sessions"])
 * @param dimensions - Array of dimensions (e.g., ["ga:date", "ga:country"])
 */
export const queryReport = (
  viewId: string,
  startDate: string = "7daysAgo",
  endDate: string = "today",
  metrics: string[] = ["ga:users"],
  dimensions: string[] = ["ga:date"]
): Promise<unknown> => {
  return window.gapi.client.request({
    path: "/v4/reports:batchGet",
    root: "https://analyticsreporting.googleapis.com/",
    method: "POST",
    body: {
      reportRequests: [
        {
          viewId: viewId,
          dateRanges: [
            {
              startDate: startDate,
              endDate: endDate,
            },
          ],
          metrics: metrics.map(m => ({ expression: m })),
          dimensions: dimensions.map(d => ({ name: d })),
        },
      ],
    },
  });
};

/**
 * Format date from YYYYMMDD to YYYY-MM-DD
 */
export const formatDate = (dateString: string): string => {
  if (dateString.length === 8) {
    return `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`;
  }
  return dateString;
};
