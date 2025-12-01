import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Component {
  name: string;
  type: string;
  approx_pct_width: number;
  approx_pct_height: number;
  depth_cm: number;
  color?: string;
  suggested_material: string;
  quantity: number;
  brand?: string;
  notes?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[ANALYZE] Starting render analysis...');
    
    const { base64Image, mimeType, prompt } = await req.json();

    if (!base64Image || !mimeType || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: base64Image, mimeType, or prompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('[ANALYZE] GEMINI_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ANALYZE] Calling Gemini API...');

    // Call Gemini API with vision capabilities
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('[ANALYZE] Gemini API error:', geminiResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Error calling Gemini API', 
          details: errorText,
          status: geminiResponse.status 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    console.log('[ANALYZE] Gemini API response received');

    // Extract the generated text from Gemini response
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      console.error('[ANALYZE] No text generated from Gemini');
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ANALYZE] Raw response:', generatedText.substring(0, 200));

    // Parse the JSON response from the AI
    let components: Component[] = [];
    try {
      // Try to extract JSON from markdown code blocks or direct JSON
      let jsonText = generatedText.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }
      
      const parsed = JSON.parse(jsonText);
      
      // Handle both array and object with components property
      if (Array.isArray(parsed)) {
        components = parsed;
      } else if (parsed.components && Array.isArray(parsed.components)) {
        components = parsed.components;
      } else {
        console.error('[ANALYZE] Unexpected JSON structure:', parsed);
        components = [];
      }
      
      console.log(`[ANALYZE] Successfully parsed ${components.length} components`);
    } catch (parseError) {
      console.error('[ANALYZE] Error parsing JSON:', parseError);
      console.error('[ANALYZE] Text that failed to parse:', generatedText);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response', 
          details: errorMessage,
          rawResponse: generatedText.substring(0, 500)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        components,
        componentsCount: components.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ANALYZE] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred', 
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
