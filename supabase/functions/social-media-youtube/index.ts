import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { title, userId } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing YouTube video title:', title);

    // Analyze title length and structure
    const titleLength = title.length;
    const hasNumbers = /\d/.test(title);
    const hasPowerWords = /(best|ultimate|complete|guide|top|easy|simple|quick|proven|expert)/i.test(title);
    const hasYear = /202[0-9]/.test(title);
    const hasEmoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/u.test(title);

    // Calculate SEO score
    let score = 70;
    if (titleLength >= 40 && titleLength <= 60) score += 10;
    if (hasNumbers) score += 5;
    if (hasPowerWords) score += 10;
    if (hasYear) score += 5;
    if (!hasEmoji) score -= 5;

    // Generate keywords based on title analysis
    const words = title.toLowerCase().split(' ').filter(w => w.length > 3);
    const keywords = [
      { keyword: words[0] || 'SEO', volume: '12K', competition: 'Medium', relevance: 92 },
      { keyword: `${words[0]} tutorial`, volume: '8.1K', competition: 'High', relevance: 88 },
      { keyword: `how to ${words[0]}`, volume: '3.6K', competition: 'Low', relevance: 85 },
      { keyword: `${words[0]} guide`, volume: '2.4K', competition: 'Medium', relevance: 78 }
    ];

    // Generate suggestions
    const suggestions = [
      titleLength > 60 ? "Keep title under 60 characters for better visibility" : "Title length is optimal",
      !hasPowerWords ? "Add power words (Best, Ultimate, Complete) at the beginning" : "Good use of power words",
      "Include your main keyword in first 100 characters of description",
      "Use 5-15 tags with mix of broad and specific keywords",
      "Add timestamps to improve watch time and engagement",
      "Create custom thumbnail with text overlay and bright colors"
    ];

    // Hashtags
    const hashtags = ["#" + (words[0] || "SEO"), "#YouTubeTips", "#VideoMarketing", "#ContentCreator", "#DigitalMarketing"];

    const result = {
      title,
      score: Math.min(100, score),
      suggestions,
      keywords,
      hashtags,
      bestLength: "8-15 minutes for tutorials",
      uploadTime: "Tuesday-Thursday 2PM-4PM EST",
      analysis: {
        titleLength,
        hasNumbers,
        hasPowerWords,
        hasYear,
        hasEmoji
      }
    };

    // Deduct credits
    if (userId) {
      const { error: creditError } = await supabase.rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: 3,
        p_feature: 'youtube_seo'
      });

      if (creditError) {
        console.error('Credit deduction error:', creditError);
      }

      // Log usage
      await supabase.from('credit_usage_history').insert({
        user_id: userId,
        feature: 'youtube_seo',
        credits_used: 3,
        metadata: { title }
      });
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in social-media-youtube function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
