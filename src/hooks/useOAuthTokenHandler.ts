import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function useOAuthTokenHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthTokens = async () => {
      // Check if URL contains OAuth tokens in hash
      const hash = location.hash || window.location.hash;
      
      if (hash && (hash.includes('access_token') || hash.includes('provider_token'))) {
        console.log('🔑 OAuth tokens detected in URL, processing...');
        
        try {
          const params = new URLSearchParams(hash.substring(1)); // Remove #
          
          const accessToken = params.get('access_token');
          const providerToken = params.get('provider_token');
          const refreshToken = params.get('refresh_token');
          const expiresAt = params.get('expires_at');

          if (accessToken && providerToken) {
            // Get current user using the access token
            const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
            
            if (userError) {
              console.error('❌ Error getting user:', userError);
            } else if (user) {
              console.log('✅ User authenticated:', user.id);
              
              // Save OAuth tokens to database
              const { error: tokenError } = await supabase
                .from('user_oauth_tokens')
                .upsert({
                  user_id: user.id,
                  provider: 'google',
                  access_token: providerToken,
                  refresh_token: refreshToken,
                  expires_at: expiresAt ? new Date(parseInt(expiresAt) * 1000).toISOString() : null,
                  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
                  updated_at: new Date().toISOString(),
                }, {
                  onConflict: 'user_id,provider'
                });

              if (tokenError) {
                console.error('❌ Error saving tokens:', tokenError);
              } else {
                console.log('✅ OAuth tokens saved successfully');
              }
            }
          }

          // Clean the URL by removing the hash (tokens are now saved)
          const cleanUrl = window.location.pathname + window.location.search;
          window.history.replaceState({}, document.title, cleanUrl);
          
          // If we're on dashboard with onboarding, stay there
          if (window.location.pathname === '/dashboard') {
            console.log('✅ Tokens processed, staying on dashboard');
            // Force a refresh to update the UI state
            window.location.reload();
          }
          
        } catch (error) {
          console.error('❌ OAuth token processing error:', error);
        }
      }
    };

    handleOAuthTokens();
  }, [location, navigate]);
}
