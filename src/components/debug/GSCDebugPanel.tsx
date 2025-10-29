import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Bug, Copy } from "lucide-react";
import { toast } from "sonner";

interface GSCSite {
  siteUrl: string;
  permissionLevel: string;
}

export function GSCDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const runDebugTest = async () => {
    setIsRunning(true);
    setLogs([]);
    
    try {
      addLog('🔍 Starting GSC Debug Test...');
      
      // Step 1: Check user authentication
      addLog('1️⃣ Checking user authentication...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        addLog(`❌ User auth error: ${userError.message}`);
        return;
      }
      
      if (!user) {
        addLog('❌ No user found - not authenticated');
        return;
      }
      
      addLog(`✅ User authenticated: ${user.id}`);
      addLog(`   Email: ${user.email}`);
      
      // Step 2: Check OAuth token in database
      addLog('2️⃣ Checking OAuth token in database...');
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .maybeSingle();
      
      if (tokenError) {
        addLog(`❌ Token fetch error: ${JSON.stringify(tokenError)}`);
        return;
      }
      
      if (!tokenData) {
        addLog('❌ No OAuth token found in database');
        addLog('   Action: Sign out and sign in with Google again');
        return;
      }
      
      addLog('✅ OAuth token found');
      addLog(`   Token preview: ${tokenData.access_token.substring(0, 20)}...`);
      addLog(`   Expires: ${tokenData.expires_at}`);
      addLog(`   Scopes: ${JSON.stringify(tokenData.scopes)}`);
      
      // Check if token is expired
      if (tokenData.expires_at) {
        const expiresAt = new Date(tokenData.expires_at);
        const now = new Date();
        if (expiresAt <= now) {
          addLog('⚠️ Token is EXPIRED');
          addLog('   Action: Sign out and sign in with Google again');
          return;
        } else {
          const minutesLeft = Math.floor((expiresAt.getTime() - now.getTime()) / 60000);
          addLog(`✅ Token is valid (expires in ${minutesLeft} minutes)`);
        }
      }
      
      // Step 3: Call gsc-sites function
      addLog('3️⃣ Calling gsc-sites edge function...');
      addLog(`   Sending request with token: ${tokenData.access_token.substring(0, 20)}...`);
      addLog('   Note: Authorization header added automatically by Supabase client');
      
      const { data, error } = await supabase.functions.invoke("gsc-sites", {
        body: { provider_token: tokenData.access_token }
      });
      
      if (error) {
        addLog(`❌ Edge function error: ${JSON.stringify(error, null, 2)}`);
        return;
      }
      
      addLog('✅ Edge function returned successfully');
      addLog(`   Response: ${JSON.stringify(data, null, 2)}`);
      
      if (data?.error) {
        addLog(`❌ API error in response: ${data.error}`);
        return;
      }
      
      if (data?.sites) {
        addLog(`✅ SUCCESS! Found ${data.sites.length} properties:`);
        data.sites.forEach((site: GSCSite, i: number) => {
          addLog(`   ${i + 1}. ${site.siteUrl} (${site.permissionLevel})`);
        });
      } else {
        addLog('⚠️ No sites in response');
      }
      
    } catch (err) {
      addLog(`❌ Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Debug test error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    toast.success('Debug logs copied to clipboard');
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        <Bug className="w-4 h-4 mr-2" />
        GSC Debug
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-[600px] max-h-[80vh] overflow-hidden flex flex-col shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bug className="w-5 h-5" />
            GSC Debug Panel
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={copyLogs} variant="ghost" size="sm" disabled={logs.length === 0}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm">
              ×
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-2 mb-4">
          <Button
            onClick={runDebugTest}
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Running Test...' : 'Run Debug Test'}
          </Button>
        </div>
        
        {logs.length > 0 && (
          <div className="bg-black text-green-400 p-4 rounded font-mono text-xs space-y-1 max-h-[500px] overflow-auto">
            {logs.map((log, i) => (
              <div key={i} className="whitespace-pre-wrap break-all">
                {log}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
