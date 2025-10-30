import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, Plus, Trash2, ExternalLink, Calendar, Globe, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useProjects, useCreateProject, useDeleteProject, COMMON_COUNTRIES, formatProjectDisplay } from "@/hooks/useProjects";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GSCSite {
  siteUrl: string;
  permissionLevel?: string;
}

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const { data: subscription } = useSubscription();
  const { mutate: createProject, isPending: isCreating } = useCreateProject();
  const { mutate: deleteProject } = useDeleteProject();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [gscProperties, setGscProperties] = useState<string[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    domain: "",
    description: "",
    gsc_property_url: "",
    country_code: "US",
    locale: "en-US",
  });

  // Extract domain from GSC property URL
  const extractDomainFromProperty = (propertyUrl: string): string => {
    if (propertyUrl.startsWith('sc-domain:')) {
      return propertyUrl.replace('sc-domain:', '').replace(/\/$/, '');
    }
    try {
      const url = new URL(propertyUrl.startsWith('http') ? propertyUrl : `https://${propertyUrl}`);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return propertyUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '');
    }
  };

  const handlePropertySelect = (propertyUrl: string) => {
    const domain = extractDomainFromProperty(propertyUrl);
    setNewProject((prev) => ({
      ...prev,
      gsc_property_url: propertyUrl,
      domain: domain,
      name: prev.name || domain.split('.')[0] || domain,
    }));
  };

  // Fetch GSC properties when dialog opens
  useEffect(() => {
    if (!isDialogOpen) return;

    const fetchGSCProperties = async () => {
      try {
        setIsLoadingProperties(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Please sign in to view properties");
          return;
        }
        
        // Get OAuth token from database
        const { data: tokenData, error: tokenError } = await supabase
          .from('user_oauth_tokens')
          .select('access_token')
          .eq('user_id', user.id)
          .eq('provider', 'google')
          .maybeSingle();
        
        if (tokenError || !tokenData) {
          console.log('No Google connection found');
          setGscProperties([]);
          return;
        }
        
        const { data, error } = await supabase.functions.invoke("gsc-sites", {
          body: { provider_token: tokenData.access_token }
        });

        if (error) {
          console.error('GSC sites error:', error);
          setGscProperties([]);
          return;
        }

        if (data?.error) {
          console.error('GSC error:', data.error);
          setGscProperties([]);
          return;
        }

        if (data?.sites && data.sites.length > 0) {
          const siteUrls = data.sites.map((site: GSCSite) => site.siteUrl);
          setGscProperties(siteUrls);
          
          // Auto-select first property if available and no property is selected
          setNewProject((prev) => {
            if (siteUrls.length > 0 && !prev.gsc_property_url) {
              const firstProperty = siteUrls[0];
              const domain = extractDomainFromProperty(firstProperty);
              return {
                ...prev,
                gsc_property_url: firstProperty,
                domain: domain,
                name: prev.name || domain.split('.')[0] || domain,
              };
            }
            return prev;
          });
        } else {
          setGscProperties([]);
        }
      } catch (error: unknown) {
        console.error("Error fetching properties:", error);
        setGscProperties([]);
      } finally {
        setIsLoadingProperties(false);
      }
    };

    fetchGSCProperties();
  }, [isDialogOpen]);

  const maxProjects = subscription?.plan?.max_projects || 3;
  const canAddMore = (projects?.length || 0) < maxProjects;

  const handleCreate = () => {
    if (!newProject.gsc_property_url || !newProject.domain) {
      toast.error("Please select a Google Search Console property");
      return;
    }

    if (!newProject.name) {
      toast.error("Project name is required");
      return;
    }

    createProject(newProject, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewProject({ name: "", domain: "", description: "", gsc_property_url: "", country_code: "US", locale: "en-US" });
        setGscProperties([]);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">SEO Projects</h1>
          <p className="text-muted-foreground">
            Manage your websites and SEO campaigns in one place
          </p>
        </div>
        
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              // Reset form when dialog closes
              setNewProject({ name: "", domain: "", description: "", gsc_property_url: "", country_code: "US", locale: "en-US" });
              setGscProperties([]);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button disabled={!canAddMore} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a website to track its SEO performance
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* GSC Property Selector */}
              <div>
                <Label htmlFor="gsc-property">Google Search Console Property *</Label>
                {isLoadingProperties ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading properties...</span>
                  </div>
                ) : gscProperties.length > 0 ? (
                  <Select
                    value={newProject.gsc_property_url}
                    onValueChange={handlePropertySelect}
                  >
                    <SelectTrigger id="gsc-property">
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {gscProperties.map((property) => (
                        <SelectItem key={property} value={property}>
                          {property}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-4 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-900 dark:text-amber-200 mb-1">
                          No Google Search Console properties found
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 text-xs mb-2">
                          Make sure you've connected your Google account and have at least one property verified in Google Search Console.
                        </p>
                        <Link 
                          to="/help/connect-search-console" 
                          className="text-xs text-amber-700 dark:text-amber-300 hover:underline font-medium"
                        >
                          Learn how to connect →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Select a property from your connected Google Search Console account. Domain and property URL will be filled automatically.
                </p>
              </div>

              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="My Awesome Site"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="domain">Domain *</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={newProject.domain}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-filled from selected property. Projects are unique per domain × country combination.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={newProject.country_code}
                    onValueChange={(value) => {
                      const country = COMMON_COUNTRIES.find(c => c.code === value);
                      setNewProject({
                        ...newProject,
                        country_code: value,
                        locale: country?.locale || "en-US",
                      });
                    }}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="locale">Locale</Label>
                  <Input
                    id="locale"
                    value={newProject.locale}
                    onChange={(e) => setNewProject({ ...newProject, locale: e.target.value })}
                    placeholder="en-US"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-filled from country. You can change it later.
                  </p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="E-commerce site selling outdoor gear..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Usage Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Projects Used</p>
              <p className="text-2xl font-bold">
                {projects?.length || 0} / {maxProjects}
              </p>
            </div>
            <Badge variant={canAddMore ? "secondary" : "destructive"}>
              {canAddMore ? `${maxProjects - (projects?.length || 0)} remaining` : 'Limit reached'}
            </Badge>
          </div>
          {!canAddMore && (
            <p className="text-sm text-muted-foreground mt-3">
              <Link to="/pricing" className="text-primary hover:underline">Upgrade your plan</Link> to add more projects
            </p>
          )}
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {!projects || projects.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first project to start tracking SEO performance
          </p>
          <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="group hover:shadow-lg transition-all hover:border-primary/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Globe className="w-4 h-4" />
                      <span>{formatProjectDisplay(project)}</span>
                      {(project.country_code !== 'US' || project.locale !== 'en-US') && (
                        <Badge variant="outline" className="ml-1 text-xs">
                          {project.country_code}
                        </Badge>
                      )}
                    </div>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Delete project "${project.name}"?`)) {
                        deleteProject(project.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.gsc_property_url && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      GSC Connected
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/dashboard?project=${project.id}`}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Dashboard
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

