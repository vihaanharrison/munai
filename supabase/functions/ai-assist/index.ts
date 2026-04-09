import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, content } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    if (type === "speech-analysis") {
      systemPrompt = `You are a Model United Nations speech analyst. Analyze the delegate's speech for: 
1. Diplomatic language quality (formal, persuasive, appropriate)
2. Policy substance (specific proposals, evidence, precedent)
3. Parliamentary procedure adherence
4. Strengths and areas for improvement
Keep feedback constructive, specific, and under 200 words.`;
    } else if (type === "resolution-draft") {
      systemPrompt = `You are a MUN resolution drafting assistant. Given the topic and key points, draft a properly formatted UN-style resolution with:
- Preambulatory clauses (italicized action verbs)
- Operative clauses (numbered, bold action verbs)
- Proper parliamentary language
Keep it concise but formally correct.`;
    } else if (type === "score-suggestion") {
      systemPrompt = `You are a MUN scoring assistant. Based on the delegate's performance description, suggest scores (1-10) for:
1. Content & Research
2. Diplomacy & Decorum
3. Public Speaking
4. Participation & Initiative
Provide brief justification for each score. Be fair and constructive.`;
    } else {
      systemPrompt = "You are a helpful MUN (Model United Nations) assistant. Answer questions about parliamentary procedure, diplomacy, and conference management.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
