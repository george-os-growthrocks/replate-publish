import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔑 Processing OAuth callback...');
        
        // Get tokens from URL hash (the # part)
        const hash = location.hash || window.location.hash;
        console.log('Hash found:', hash ? 'Yes' : 'No');
        
        if (hash) {
          const params = new URLSearchParams(hash.substring(1)); // Remove #
          
          const accessToken = params.get('access_token');
          const providerToken = params.get('provider_token');
          const refreshToken = params.get('refresh_token');
          const expiresIn = params.get('expires_in');
          const expiresAt = params.get('expires_at');

          console.log('Tokens found:', {
            accessToken: accessToken ? 'Yes' : 'No',
            providerToken: providerToken ? 'Yes' : 'No',
            refreshToken: refreshToken ? 'Yes' : 'No'
          });

          if (accessToken && providerToken) {
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
            
            if (userError) {
              console.error('❌ Error getting user:', userError);
            } else if (user) {
              console.log('✅ User authenticated:', user.id);
              
              // Save OAuth tokens to database
              console.log('💾 Saving OAuth tokens to database...', {
                userId: user.id,
                hasProviderToken: !!providerToken,
                hasRefreshToken: !!refreshToken,
                expiresAt: expiresAt ? new Date(parseInt(expiresAt) * 1000).toISOString() : null
              });

              const { error: tokenError } = await supabase
                .from('user_oauth_tokens')
                .upsert({
                  user_id: user.id,
                  provider: 'google',
                  access_token: providerToken,
                  refresh_token: refreshToken,
                  expires_at: expiresAt ? new Date(parseInt(expiresAt) * 1000).toISOString() : null,
                  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'], // Note: using 'scopes' (array) as per migration
                  updated_at: new Date().toISOString(),
                }, {
                  onConflict: 'user_id,provider'
                });

              if (tokenError) {
                console.error('❌ Error saving tokens:', tokenError);
                console.error('Token error details:', JSON.stringify(tokenError, null, 2));
              } else {
                console.log('✅ OAuth tokens saved successfully');

                // Verify tokens were saved
                const { data: verifyData, error: verifyError } = await supabase
                  .from('user_oauth_tokens')
                  .select('access_token, expires_at')
                  .eq('user_id', user.id)
                  .eq('provider', 'google')
                  .single();

                console.log('🔍 Token verification:', {
                  saved: !!verifyData,
                  hasToken: !!verifyData?.access_token,
                  verifyError: verifyError?.message
                });
              }
            }
          } else {
            console.warn('⚠️ Missing required tokens in callback');
          }
        } else {
          console.warn('⚠️ No hash found in callback URL');
        }

        // Redirect to dashboard after processing
        console.log('🔄 Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
        
      } catch (error) {
        console.error('❌ Callback error:', error);
        // Still redirect to dashboard even on error
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      }
    };

    handleCallback();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold mb-2">Processing authentication...</h2>
        <p className="text-muted-foreground">Setting up your Google Search Console connection.</p>
        <p className="text-sm text-muted-foreground mt-2">You'll be redirected automatically.</p>
      </div>
    </div>
  );
}
