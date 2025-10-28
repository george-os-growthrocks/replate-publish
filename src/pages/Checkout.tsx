import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');

  useEffect(() => {
    const initiateCheckout = async () => {
      try {
        // Get plan and billing from URL params
        const planName = searchParams.get('plan');
        const billingCycle = searchParams.get('billing') || 'monthly';

        if (!planName) {
          toast.error('No plan selected');
          navigate('/pricing');
          return;
        }

        // Wait a bit for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check authentication - try multiple times
        let session = null;
        for (let i = 0; i < 3; i++) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            session = data.session;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!session) {
          console.error('No session found after retries');
          toast.error('Session expired. Please sign in again.');
          navigate('/login');
          return;
        }

        console.log('Session found, access_token present:', !!session.access_token);

        setStatus('redirecting');

        // Call edge function to create checkout session
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        console.log('Calling stripe-checkout with planName:', planName, 'billingCycle:', billingCycle);

        const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({ planName, billingCycle }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create checkout session');
        }

        const data = await response.json();
        
        if (data.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL received');
        }

      } catch (error) {
        console.error('Checkout error:', error);
        setStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
        toast.error(errorMessage);
        
        // Redirect back to pricing after 3 seconds
        setTimeout(() => {
          navigate('/pricing');
        }, 3000);
      }
    };

    initiateCheckout();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Preparing your checkout...</h2>
            <p className="text-muted-foreground">Please wait while we set up your subscription</p>
          </>
        )}

        {status === 'redirecting' && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">Redirecting to Stripe...</h2>
            <p className="text-muted-foreground">You'll be redirected to complete your payment</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Checkout Failed</h2>
            <p className="text-muted-foreground">Redirecting back to pricing...</p>
          </>
        )}
      </Card>
    </div>
  );
};

export default Checkout;
