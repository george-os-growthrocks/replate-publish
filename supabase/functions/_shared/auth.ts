import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

/**
 * Validates JWT token and returns authenticated user
 * Throws error if authentication fails
 */
export async function requireAuth(req: Request): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  return {
    id: user.id,
    email: user.email
  };
}

/**
 * Checks if user has sufficient credits
 * Returns current credits or throws error
 */
export async function checkCredits(
  userId: string, 
  requiredCredits: number
): Promise<number> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new Error('Failed to fetch user profile');
  }

  const currentCredits = profile.credits || 0;

  if (currentCredits < requiredCredits) {
    throw new Error(`Insufficient credits. Required: ${requiredCredits}, Available: ${currentCredits}`);
  }

  return currentCredits;
}

/**
 * Deducts credits from user account
 */
export async function deductCredits(
  userId: string,
  creditsToDeduct: number
): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { error } = await supabase.rpc('deduct_credits', {
    user_id_param: userId,
    credits_to_deduct: creditsToDeduct
  });

  if (error) {
    throw new Error(`Failed to deduct credits: ${error.message}`);
  }
}

/**
 * Verifies user owns a project
 */
export async function verifyProjectOwnership(
  userId: string,
  projectId: string
): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: project, error } = await supabase
    .from('seo_projects')
    .select('user_id')
    .eq('id', projectId)
    .single();

  if (error || !project) {
    return false;
  }

  return project.user_id === userId;
}
