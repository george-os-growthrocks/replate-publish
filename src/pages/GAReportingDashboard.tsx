import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart3, TrendingUp, Users, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { checkSignedIn, signIn, signOut, queryReport, formatDate } from "@/utils/gapiUtils";

interface ReportRow {
  date: string;
  visits: string;
}

export default function GAReportingDashboard() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewId, setViewId] = useState("");
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [gapiReady, setGapiReady] = useState(false);

  // Initialize GAPI auth on component mount
  useEffect(() => {
    const initGAPI = () => {
      if (window.gapi) {
        console.log("GAPI loaded, initializing auth2...");
        window.gapi.load("auth2", () => {
          console.log("Auth2 library loaded");
          checkSignedIn()
            .then((signedIn) => {
              console.log("Sign-in check successful, signed in:", signedIn);
              setIsSignedIn(signedIn);
              setGapiReady(true);
              if (signedIn) {
                toast.success("Already signed in to Google Analytics");
              }
            })
            .catch((error) => {
              console.error("Error checking sign-in status:", error);
              console.error("Error details:", JSON.stringify(error, null, 2));
              
              // Still mark as ready so user can attempt sign-in
              setGapiReady(true);
              
              // Show helpful error message
              if (error.error === "idpiframe_initialization_failed") {
                toast.error("OAuth configuration error. Check Google Cloud Console settings.");
              }
            });
        });
      } else {
        // GAPI not loaded yet, try again
        setTimeout(initGAPI, 100);
      }
    };

    initGAPI();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      console.log("Attempting to sign in...");
      await signIn();
      setIsSignedIn(true);
      toast.success("Successfully signed in to Google Analytics!");
    } catch (error) {
      console.error("Sign-in error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      // Provide specific error messages
      const errorObj = error as { error?: string };
      if (errorObj.error === "popup_closed_by_user") {
        toast.error("Sign-in cancelled. Please try again.");
      } else if (errorObj.error === "access_denied") {
        toast.error("Access denied. Please grant analytics.readonly permission.");
      } else if (errorObj.error === "idpiframe_initialization_failed") {
        toast.error("OAuth configuration error. Check your Client ID and authorized origins in Google Cloud Console.");
      } else {
        toast.error("Failed to sign in. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsSignedIn(false);
      setReportData([]);
      setViewId("");
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Sign-out error:", error);
      toast.error("Failed to sign out");
    }
  };

  const handleLoadReport = async () => {
    if (!viewId) {
      toast.error("Please enter a View ID");
      return;
    }

    setLoading(true);
    try {
      console.log("Querying GA report for View ID:", viewId);
      
      const response = await queryReport(
        viewId,
        "10daysAgo",
        "today",
        ["ga:users"],
        ["ga:date"]
      );

      // Type assertion for the response structure
      const result = response as {
        result: {
          reports: Array<{
            data: {
              rows?: Array<{
                dimensions: string[];
                metrics: Array<{ values: string[] }>;
              }>;
            };
          }>;
        };
      };

      const queryResult = result.result.reports[0]?.data?.rows || [];
      
      const formattedData: ReportRow[] = queryResult.map((row) => {
        const dateString = row.dimensions[0];
        const formattedDate = formatDate(dateString);
        return {
          date: formattedDate,
          visits: row.metrics[0].values[0],
        };
      });

      setReportData(formattedData);
      toast.success(`Loaded ${formattedData.length} days of data`);
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load analytics data. Check your View ID.");
    } finally {
      setLoading(false);
    }
  };

  if (!gapiReady) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Google API...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Google Analytics Reporting API v4</h1>
          <p className="text-muted-foreground">
            Client-side integration using GAPI JavaScript library
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Sign In Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This dashboard uses the <strong>Google Analytics Reporting API v4</strong> with 
                client-side authentication. You'll need a Google account with Analytics access.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-sm">Setup Instructions:</h3>
                <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                  <li>Set up OAuth 2.0 Client ID in Google Cloud Console</li>
                  <li>Add <code className="bg-background px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> to your .env file</li>
                  <li>Enable Google Analytics Reporting API v4</li>
                  <li>Sign in below to authorize access</li>
                </ol>
              </div>

              <Button 
                onClick={handleSignIn} 
                size="lg" 
                className="w-full gradient-primary"
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? "Signing In..." : "Sign in with Google"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Get Your View ID</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Method 1: Google Analytics Admin</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to your Google Analytics account</li>
                <li>Navigate to <strong>Admin</strong> section (bottom left)</li>
                <li>In the View column, click <strong>View Settings</strong></li>
                <li>Copy the <strong>View ID</strong> (numeric value)</li>
              </ol>

              <p className="font-medium text-foreground mt-4">Method 2: Account Explorer</p>
              <p>Use the <a href="https://ga-dev-tools.google/account-explorer/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Account Explorer Service</a> to find your View ID</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Google Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Reporting API v4 - Last 10 days of visitor data
          </p>
        </div>
        <Button onClick={handleSignOut} variant="outline">
          Sign Out
        </Button>
      </div>

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          ✅ Successfully authenticated with Google Analytics Reporting API
        </AlertDescription>
      </Alert>

      {/* View ID Input & Load Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Load Analytics Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="viewId">Google Analytics View ID</Label>
              <Input
                id="viewId"
                type="text"
                placeholder="e.g., 123456789"
                value={viewId}
                onChange={(e) => setViewId(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your GA Universal Analytics View ID (not GA4 property ID)
              </p>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleLoadReport}
                className="w-full"
                disabled={loading || !viewId}
              >
                {loading ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Loading...</>
                ) : (
                  <><TrendingUp className="w-4 h-4 mr-2" />Load Report</>
                )}
              </Button>
            </div>
          </div>

          {viewId && (
            <Badge variant="outline">
              Current View ID: {viewId}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Report Data Display */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Visitor Report (Last 10 Days)
              </span>
              <Badge>{reportData.length} days</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reportData.map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{row.date}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(row.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{row.visits}</p>
                    <p className="text-xs text-muted-foreground">visitors</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold">
                  {reportData.reduce((sum, row) => sum + parseInt(row.visits), 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Daily Average</p>
                <p className="text-2xl font-bold">
                  {Math.round(
                    reportData.reduce((sum, row) => sum + parseInt(row.visits), 0) / reportData.length
                  ).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Peak Day</p>
                <p className="text-2xl font-bold">
                  {Math.max(...reportData.map(row => parseInt(row.visits))).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {reportData.length === 0 && viewId && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Enter your View ID above and click "Load Report" to see your analytics data
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
