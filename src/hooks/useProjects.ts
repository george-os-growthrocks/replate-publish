import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SEOProject {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  gsc_property_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('seo_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SEOProject[];
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (project: { name: string; domain: string; description?: string; gsc_property_url?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('seo_projects')
        .insert({
          user_id: user.id,
          name: project.name,
          domain: project.domain,
          description: project.description || null,
          gsc_property_url: project.gsc_property_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully!');
    },
    onError: (error: any) => {
      console.error('Create project error:', error);
      if (error.message?.includes('unique')) {
        toast.error('A project with this domain already exists');
      } else {
        toast.error('Failed to create project');
      }
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SEOProject> }) => {
      const { data, error } = await supabase
        .from('seo_projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated successfully!');
    },
    onError: (error) => {
      console.error('Update project error:', error);
      toast.error('Failed to update project');
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('seo_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully!');
    },
    onError: (error) => {
      console.error('Delete project error:', error);
      toast.error('Failed to delete project');
    },
  });
}

