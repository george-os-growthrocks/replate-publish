import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  User, 
  Building2, 
  Link as LinkIcon, 
  CreditCard, 
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react";

interface Profile {
  full_name: string;
  industry: string;
  company_name: string;
  job_title: string;
  website: string;
}

interface GSCProperty {
  id: string;
  site_url: string;
  permission_level: string;
  selected: boolean;
}

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    industry: "",
    company_name: "",
    job_title: "",
    website: "",
  });

  // GSC state
  const [gscProperties, setGscProperties] = useState<GSCProperty[]>([]);
  const [gscConnected, setGscConnected] = useState(false);
  const [isCheckingGSC, setIsCheckingGSC] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await loadUserData();
      
      // After user data is loaded, check if returning from OAuth
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('gsc_connected') === 'true') {
        toast.success('Google Search Console connected successfully!');
        await checkGSCConnection();
        // Clean up URL
        window.history.replaceState({}, '', '/settings');
      }
    };
    
    loadData();
  }, []);

  const loadUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (profileData) {
      setProfile({
        full_name: profileData.full_name || "",
        industry: profileData.industry || "",
        company_name: profileData.company_name || "",
        job_title: profileData.job_title || "",
        website: profileData.website || "",
      });
    }

    // Check GSC connection
    await checkGSCConnection();
  };

  const checkGSCConnection = async () => {
    setIsCheckingGSC(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        return;
      }
      
      if (!session) {
        console.log("No session found");
        return;
      }

      const { data: tokens, error: tokensError } = await supabase
        .from("user_oauth_tokens")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("provider", "google")
        .maybeSingle();

      if (tokensError) {
        console.error("Error fetching tokens:", tokensError);
        return;
      }

      setGscConnected(!!tokens);

      if (tokens) {
        // Load connected properties
        const { data: properties, error: propertiesError } = await supabase
          .from("gsc_properties")
          .select("*")
          .eq("user_id", session.user.id);

        if (propertiesError) {
          console.error("Error fetching properties:", propertiesError);
          return;
        }

        if (properties) {
          setGscProperties(properties);
        }
      }
    } catch (error) {
      console.error("Error checking GSC connection:", error);
    } finally {
      setIsCheckingGSC(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGSC = async () => {
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please sign in again.");
        navigate("/auth");
        return;
      }

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gsc-oauth-start?user_id=${encodeURIComponent(user.id)}&redirect_to=settings`;

      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.redirect_url) {
          toast.success('Redirecting to Google...');
          window.location.href = data.redirect_url;
          return;
        }
      }

      throw new Error('Failed to get OAuth URL');
    } catch (error: any) {
      console.error("Error connecting GSC:", error);
      toast.error(error.message || "Failed to connect Google Search Console");
      setIsLoading(false);
    }
  };

  const handleFetchProperties = async () => {
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please sign in again.");
        navigate("/auth");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gsc-sites`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.sites && data.sites.length > 0) {
        // Store properties in database via gsc-save-property function
        // For now, just reload the page to show them
        await checkGSCConnection();
        toast.success(`Found ${data.sites.length} properties. Refresh to see them.`);
      } else {
        toast.warning("No GSC properties found in your account");
      }
    } catch (error: any) {
      console.error("Error fetching properties:", error);
      toast.error(error.message || "Failed to fetch GSC properties");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectGSC = async () => {
    if (!confirm("Are you sure you want to disconnect Google Search Console? This will remove access to your GSC data.")) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("user_oauth_tokens")
        .delete()
        .eq("user_id", user.id)
        .eq("provider", "google");

      if (error) throw error;

      setGscConnected(false);
      setGscProperties([]);
      toast.success("Google Search Console disconnected");
    } catch (error: any) {
      console.error("Error disconnecting GSC:", error);
      toast.error(error.message || "Failed to disconnect GSC");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: (e.target as any).newPassword.value
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="connections">
              <LinkIcon className="w-4 h-4 mr-2" />
              Connections
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company</Label>
                      <Input
                        id="company_name"
                        value={profile.company_name}
                        onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                        placeholder="Acme Inc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="job_title">Job Title</Label>
                      <Input
                        id="job_title"
                        value={profile.job_title}
                        onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                        placeholder="SEO Manager"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={profile.industry}
                      onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                      placeholder="Technology, E-commerce, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Google Search Console</CardTitle>
                <CardDescription>
                  Connect your Google Search Console account to access SEO data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCheckingGSC ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : gscConnected ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900 dark:text-green-100">
                          Google Search Console Connected
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {gscProperties.length} property(ies) connected
                        </p>
                      </div>
                    </div>

                    {gscProperties.length > 0 && (
                      <div className="space-y-2">
                        <Label>Connected Properties:</Label>
                        {gscProperties.map((property) => (
                          <div 
                            key={property.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{property.site_url}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {property.permission_level} access
                                {property.selected && " • Selected"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleFetchProperties}
                        variant="outline"
                        disabled={isLoading}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Properties
                      </Button>
                      <Button 
                        onClick={handleConnectGSC}
                        variant="outline"
                        disabled={isLoading}
                      >
                        Reconnect
                      </Button>
                      <Button 
                        onClick={handleDisconnectGSC}
                        variant="destructive"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          "Disconnect"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <XCircle className="w-6 h-6 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Not Connected</p>
                        <p className="text-sm text-muted-foreground">
                          Connect your GSC account to access your SEO data
                        </p>
                      </div>
                    </div>

                    <Button onClick={handleConnectGSC}>
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Connect Google Search Console
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your account password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 6 characters
                    </p>
                  </div>

                  <Button type="submit">
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;

