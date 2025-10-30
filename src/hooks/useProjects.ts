import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SEOProject {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  country_code: string;
  locale: string;
  gsc_property_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  name: string;
  domain: string;
  country_code?: string;
  locale?: string;
  description?: string;
  gsc_property_url?: string;
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
    mutationFn: async (project: CreateProjectData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('seo_projects')
        .insert({
          user_id: user.id,
          name: project.name,
          domain: project.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, ''),
          country_code: project.country_code || 'US',
          locale: project.locale || 'en-US',
          description: project.description || null,
          gsc_property_url: project.gsc_property_url || null,
        })
        .select()
        .single();

      if (error) {
        // Check for unique constraint violation
        if (error.code === '23505') {
          throw new Error('A project with this domain, country, and locale already exists. Projects are unique per domain-country-locale combination.');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully!');
    },
    onError: (error: Error | { message?: string; code?: string }) => {
      console.error('Create project error:', error);
      const message = error instanceof Error ? error.message : error.message || 'Failed to create project';
      toast.error(message);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SEOProject> }) => {
      const { data, error } = await supabase
        .from('seo_projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A project with this domain, country, and locale combination already exists.');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated successfully!');
    },
    onError: (error: Error | { message?: string }) => {
      console.error('Update project error:', error);
      const message = error instanceof Error ? error.message : error.message || 'Failed to update project';
      toast.error(message);
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

/**
 * Format project display name with country
 */
export function formatProjectDisplay(project: SEOProject): string {
  if (project.country_code === 'US' && project.locale === 'en-US') {
    return project.domain;
  }
  return `${project.domain} (${project.country_code})`;
}

/**
 * Get common countries list
 */
export const COMMON_COUNTRIES = [
  { code: 'US', name: 'United States', locale: 'en-US' },
  { code: 'GB', name: 'United Kingdom', locale: 'en-GB' },
  { code: 'CA', name: 'Canada', locale: 'en-CA' },
  { code: 'AU', name: 'Australia', locale: 'en-AU' },
  { code: 'DE', name: 'Germany', locale: 'de-DE' },
  { code: 'FR', name: 'France', locale: 'fr-FR' },
  { code: 'ES', name: 'Spain', locale: 'es-ES' },
  { code: 'IT', name: 'Italy', locale: 'it-IT' },
  { code: 'NL', name: 'Netherlands', locale: 'nl-NL' },
  { code: 'JP', name: 'Japan', locale: 'ja-JP' },
  { code: 'CN', name: 'China', locale: 'zh-CN' },
  { code: 'IN', name: 'India', locale: 'en-IN' },
  { code: 'BR', name: 'Brazil', locale: 'pt-BR' },
  { code: 'MX', name: 'Mexico', locale: 'es-MX' },
  { code: 'RU', name: 'Russia', locale: 'ru-RU' },
] as const;
