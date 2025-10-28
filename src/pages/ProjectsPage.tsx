import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FolderOpen, Plus, Trash2, ExternalLink, Calendar, Globe, Loader2, CheckCircle2 } from "lucide-react";
import { useProjects, useCreateProject, useDeleteProject } from "@/hooks/useProjects";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const { data: subscription } = useSubscription();
  const { mutate: createProject, isPending: isCreating } = useCreateProject();
  const { mutate: deleteProject } = useDeleteProject();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    domain: "",
    description: "",
    gsc_property_url: "",
  });

  const maxProjects = subscription?.plan?.max_projects || 3;
  const canAddMore = (projects?.length || 0) < maxProjects;

  const handleCreate = () => {
    if (!newProject.name || !newProject.domain) {
      toast.error("Name and domain are required");
      return;
    }

    createProject(newProject, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewProject({ name: "", domain: "", description: "", gsc_property_url: "" });
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
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  onChange={(e) => setNewProject({ ...newProject, domain: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="gsc">GSC Property URL (Optional)</Label>
                <Input
                  id="gsc"
                  placeholder="sc-domain:example.com"
                  value={newProject.gsc_property_url}
                  onChange={(e) => setNewProject({ ...newProject, gsc_property_url: e.target.value })}
                />
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
                      {project.domain}
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

