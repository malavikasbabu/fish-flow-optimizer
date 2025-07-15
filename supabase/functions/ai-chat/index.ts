
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!openAIApiKey) {
      return new Response(JSON.stringify({ 
        response: "I'm currently not configured with an API key. Please ask an administrator to set up the OPENAI_API_KEY in the edge function secrets." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an AI assistant specialized in fish supply chain management and cold chain logistics. 
    You help users optimize their fish distribution networks, understand spoilage calculations, route planning, and supply chain decisions.
    
    Key areas you can help with:
    - Fish spoilage rates and preservation techniques
    - Cold chain logistics and temperature management  
    - Route optimization and transportation planning
    - Market demand analysis and pricing strategies
    - Cost-benefit analysis for different distribution strategies
    - Regulatory compliance for fish transportation
    - Best practices for different fish types (tilapia, pomfret, mackerel, sardine, tuna)
    
    Always provide practical, actionable advice and explain calculations when relevant.
    Keep responses concise but informative.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get AI response');
    }

    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      response: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment." 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
