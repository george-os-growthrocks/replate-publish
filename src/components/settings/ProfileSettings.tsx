import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Building, Globe, Briefcase, Users, TrendingUp, Save, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ProfileSettings() {
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
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

  return (
    <div className="space-y-6">
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
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-3xl font-bold">
                {profile.firstName?.charAt(0) || userEmail?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm" disabled>
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>

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
    </div>
  );
}

