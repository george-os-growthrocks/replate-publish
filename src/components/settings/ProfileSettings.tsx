import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { User, Building, Globe, Briefcase, Users, TrendingUp, Save, Upload, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

export function ProfileSettings() {
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    company: "",
    website: "",
    jobTitle: "",
    industry: "",
    teamSize: "",
    monthlyTraffic: "",
    primaryGoals: "",
    bio: "",
    twitterHandle: "",
    linkedinUrl: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || "");
      setUserId(user.id);
      
      // Try to load from user_profiles table first
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileData) {
        setAvatarUrl(profileData.avatar_url || "");
        setProfile({
          firstName: profileData.first_name || "",
          lastName: profileData.last_name || "",
          company: profileData.company_name || "",
          website: profileData.website_url || "",
          jobTitle: profileData.job_title || "",
          industry: profileData.industry || "",
          teamSize: profileData.team_size || "",
          monthlyTraffic: profileData.monthly_traffic || "",
          primaryGoals: profileData.primary_goals || "",
          bio: profileData.bio || "",
          twitterHandle: profileData.twitter_handle || "",
          linkedinUrl: profileData.linkedin_url || "",
        });
      } else {
        // Fallback to user_metadata if profile table doesn't exist yet
        const metadata = user.user_metadata || {};
        setProfile({
          firstName: metadata.firstName || "",
          lastName: metadata.lastName || "",
          company: metadata.company || "",
          website: metadata.website || "",
          jobTitle: metadata.jobTitle || "",
          industry: metadata.industry || "",
          teamSize: metadata.teamSize || "",
          monthlyTraffic: metadata.monthlyTraffic || "",
          primaryGoals: metadata.primaryGoals || "",
          bio: metadata.bio || "",
          twitterHandle: metadata.twitterHandle || "",
          linkedinUrl: metadata.linkedinUrl || "",
        });
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Try to save to user_profiles table first
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          first_name: profile.firstName,
          last_name: profile.lastName,
          company_name: profile.company,
          website_url: profile.website,
          job_title: profile.jobTitle,
          industry: profile.industry,
          team_size: profile.teamSize,
          monthly_traffic: profile.monthlyTraffic,
          primary_goals: profile.primaryGoals,
          bio: profile.bio,
          twitter_handle: profile.twitterHandle,
          linkedin_url: profile.linkedinUrl,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.warn('Profile table save failed, using user_metadata:', profileError);
        // Fallback to user_metadata
        const { error: metaError } = await supabase.auth.updateUser({
          data: profile
        });
        if (metaError) throw metaError;
      }

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type 'DELETE' to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      toast.info("Deleting your account and all data... This may take a moment.");

      // Delete user data from all tables in order (respecting foreign key constraints)
      const userId = user.id;

      // Tables that need explicit deletion (those without ON DELETE CASCADE or direct references)
      // Note: LLM tables (llm_citations, llm_tracking_queries, etc.) don't have user_id;
      // they're linked via project_id and will cascade when seo_projects is deleted
      const tablesToDelete = [
        'usage_meters',
        'seats',
        'add_ons',
        'overage_events',
        'seo_projects', // Delete this first - will cascade to LLM tables
        'user_profiles',
        'user_subscriptions',
        'user_credits',
        'credit_transactions',
        'user_oauth_tokens',
        'user_feature_access',
        'free_tool_usage',
        'industry_intelligence',
        'user_activity_log',
        'chatbot_conversations',
        'keyword_rankings',
        'tracked_keywords',
      ];
      
      // Optional tables that may or may not exist or have user_id
      const optionalTables = [
        'ai_overview_rankings',
        'chatgpt_citations',
        'atp_queries_cache',
        'analysis_history',
        'google_analytics_connections',
        'google_analytics_reports',
        'dataforseo_rate_limits',
      ];

      // Delete from each table
      for (const table of tablesToDelete) {
        try {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('user_id', userId);
          
          if (error && !error.message.includes('does not exist') && !error.message.includes('column') && !error.message.includes('not found')) {
            console.warn(`Warning deleting from ${table}:`, error);
          }
        } catch (err: any) {
          // Skip if table/column doesn't exist
          if (err?.message?.includes('column') || err?.message?.includes('not found')) {
            console.log(`Skipping ${table} (table or column doesn't exist)`);
          } else {
            console.warn(`Error deleting from ${table}:`, err);
          }
        }
      }
      
      // Try to delete from optional tables (they may not exist or may not have user_id)
      for (const table of optionalTables) {
        try {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('user_id', userId);
          
          // Silently ignore errors for optional tables
          if (error) {
            console.log(`Skipped optional table ${table}`);
          }
        } catch (err) {
          // Silently ignore
          console.log(`Skipped optional table ${table}`);
        }
      }

      // Finally, delete the auth user via database function
      // This will also delete all remaining data via cascade
      const { error: rpcError } = await supabase.rpc('delete_user_account', {
        target_user_id: userId
      });

      if (rpcError) {
        console.error('Could not fully delete account:', rpcError);
        toast.error(rpcError.message || "Failed to delete account. Please contact support.");
        return;
      }

      toast.success("Account and all data deleted successfully");
      
      // Redirect to home (user will be automatically signed out since account is deleted)
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (error: any) {
      console.error("Account deletion error:", error);
      toast.error(error.message || "Failed to delete account. Please contact support.");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeleteConfirmText("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar Upload */}
      <AvatarUpload
        currentAvatarUrl={avatarUrl}
        userEmail={userEmail}
        onUploadComplete={(url) => setAvatarUrl(url)}
      />

      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              disabled
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Contact support to change your email address
            </p>
          </div>

          <div>
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              disabled
              className="bg-muted/50 font-mono text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Company Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              placeholder="Acme Inc."
              value={profile.company}
              onChange={(e) => setProfile({ ...profile, company: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="website">Website URL</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://example.com"
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                placeholder="SEO Manager"
                value={profile.jobTitle}
                onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="E-commerce"
                value={profile.industry}
                onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="teamSize">Team Size</Label>
              <select
                id="teamSize"
                value={profile.teamSize}
                onChange={(e) => setProfile({ ...profile, teamSize: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select...</option>
                <option value="1">Just me</option>
                <option value="2-5">2-5 people</option>
                <option value="6-10">6-10 people</option>
                <option value="11-50">11-50 people</option>
                <option value="51+">51+ people</option>
              </select>
            </div>
            <div>
              <Label htmlFor="monthlyTraffic">Monthly Traffic</Label>
              <select
                id="monthlyTraffic"
                value={profile.monthlyTraffic}
                onChange={(e) => setProfile({ ...profile, monthlyTraffic: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select...</option>
                <option value="0-10k">0-10k visits/mo</option>
                <option value="10k-50k">10k-50k visits/mo</option>
                <option value="50k-100k">50k-100k visits/mo</option>
                <option value="100k-500k">100k-500k visits/mo</option>
                <option value="500k+">500k+ visits/mo</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals & Bio Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Goals & About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="goals">Primary SEO Goals</Label>
            <Textarea
              id="goals"
              placeholder="Increase organic traffic by 50%, improve rankings for 20 target keywords..."
              value={profile.primaryGoals}
              onChange={(e) => setProfile({ ...profile, primaryGoals: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio / About</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself and your SEO experience..."
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Links Card */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="twitter">Twitter Handle</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">@</span>
              <Input
                id="twitter"
                placeholder="yourusername"
                value={profile.twitterHandle}
                onChange={(e) => setProfile({ ...profile, twitterHandle: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <Input
              id="linkedin"
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              value={profile.linkedinUrl}
              onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={loadProfile}>
          Reset Changes
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gradient-primary">
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>
      </div>

      {/* Delete Account Section */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action cannot be undone. This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Your profile and account information</li>
                <li>All SEO projects and tracking data</li>
                <li>All keyword rankings and history</li>
                <li>All LLM citation tracking data</li>
                <li>All chat conversations</li>
                <li>All credits and subscription data</li>
                <li>All analytics and reports</li>
                <li>Any other data associated with your account</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account and all of your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Type <strong className="font-mono">DELETE</strong> in the box below to confirm.
                  </AlertDescription>
                </Alert>
                <div>
                  <Input
                    placeholder="Type DELETE to confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    disabled={isDeleting}
                    className="font-mono"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setDeleteConfirmText("");
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== "DELETE"}
                >
                  {isDeleting ? (
                    <>Deleting...</>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Permanently Delete Account
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

