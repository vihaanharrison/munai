import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (typeof text !== "string" || text.length === 0) {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text.length > 10000) {
      return new Response(JSON.stringify({ error: "text too long (max 10,000 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Extract MUN awards from the user's free-text input below. Return ONLY a JSON array. Each item must have: { "award": string, "committee": string|null, "conference": string|null, "year": string|null }. Combine duplicates. If you can't find any, return [].\n\nINPUT:\n${text}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You output ONLY valid JSON arrays. No prose." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      return new Response(JSON.stringify({ error: `AI error: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const content: string = data.choices?.[0]?.message?.content ?? "[]";
    // Strip code fences if present
    const cleaned = content.replace(/```json\s*/g, "").replace(/```/g, "").trim();
    let parsed: unknown = [];
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      parsed = match ? JSON.parse(match[0]) : [];
    }
    if (!Array.isArray(parsed)) parsed = [];

    return new Response(JSON.stringify({ awards: parsed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
