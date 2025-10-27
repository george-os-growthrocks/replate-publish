import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, domain, taskId, limit, offset, filters, orderBy } = await req.json();

    const DATAFORSEO_LOGIN = Deno.env.get('DATAFORSEO_LOGIN');
    const DATAFORSEO_PASSWORD = Deno.env.get('DATAFORSEO_PASSWORD');

    if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
      throw new Error('DataForSEO credentials not configured');
    }

    const auth = btoa(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`);

    // Action: task_post - Start a new crawl
    if (action === 'task_post') {
      if (!domain) {
        throw new Error('Domain is required for task_post');
      }

      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

      const payload = [{
        target: cleanDomain,
        max_crawl_pages: 500,
        load_resources: true,
        enable_javascript: true,
        enable_browser_rendering: false, // Set to true for Core Web Vitals (costs more)
        calculate_keyword_density: false,
        validate_micromarkup: true,
        check_spell: false,
        // crawl_delay defaults to 2000ms - don't override
      }];

      console.log('[DataForSEO OnPage] Starting crawl for:', cleanDomain);
      console.log('[DataForSEO OnPage] Payload:', JSON.stringify(payload));

      const response = await fetch('https://api.dataforseo.com/v3/on_page/task_post', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      console.log('[DataForSEO OnPage] Response status:', data.status_code);
      console.log('[DataForSEO OnPage] Response message:', data.status_message);
      console.log('[DataForSEO OnPage] Tasks count:', data.tasks_count);
      console.log('[DataForSEO OnPage] Tasks error:', data.tasks_error);

      if (!response.ok) {
        console.error('[DataForSEO OnPage] HTTP Error:', data);
        throw new Error(data.status_message || 'Failed to start crawl');
      }

      const task = data.tasks?.[0];
      if (task) {
        console.log('[DataForSEO OnPage] Task status:', task.status_code, '-', task.status_message);
        console.log('[DataForSEO OnPage] Task ID:', task.id);
        console.log('[DataForSEO OnPage] Task cost:', task.cost);
        
        if (task.status_code !== 20100) {
          console.error('[DataForSEO OnPage] Task creation failed!');
          console.error('[DataForSEO OnPage] Full task response:', JSON.stringify(task));
        }
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: summary - Get crawl summary and progress
    if (action === 'summary') {
      if (!taskId) {
        throw new Error('Task ID is required for summary');
      }

      console.log('[DataForSEO OnPage] Fetching summary for task:', taskId);

      const response = await fetch(`https://api.dataforseo.com/v3/on_page/summary/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[DataForSEO OnPage] Summary error:', data);
        throw new Error(data.status_message || 'Failed to fetch summary');
      }

      console.log('[DataForSEO OnPage] Summary fetched, crawl_progress:', data.tasks?.[0]?.result?.[0]?.crawl_progress);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: pages - Get crawled pages with filters
    if (action === 'pages') {
      if (!taskId) {
        throw new Error('Task ID is required for pages');
      }

      const payload = [{
        id: taskId,
        limit: limit || 100,
        offset: offset || 0,
        filters: filters || [],
        order_by: orderBy || ["onpage_score,desc"],
      }];

      console.log('[DataForSEO OnPage] Fetching pages for task:', taskId, 'with filters:', filters);

      const response = await fetch('https://api.dataforseo.com/v3/on_page/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[DataForSEO OnPage] Pages error:', data);
        throw new Error(data.status_message || 'Failed to fetch pages');
      }

      console.log('[DataForSEO OnPage] Pages fetched:', data.tasks?.[0]?.result?.[0]?.items?.length || 0);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: tasks_ready - Check if any tasks are ready
    if (action === 'tasks_ready') {
      console.log('[DataForSEO OnPage] Checking tasks ready');

      const response = await fetch('https://api.dataforseo.com/v3/on_page/tasks_ready', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[DataForSEO OnPage] Tasks ready error:', data);
        throw new Error(data.status_message || 'Failed to check tasks');
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('[DataForSEO OnPage] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
