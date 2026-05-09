const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { speech_text, country, agenda } = await req.json();
    if (!speech_text || typeof speech_text !== "string" || speech_text.trim().length < 5) {
      return new Response(JSON.stringify({ error: "speech_text required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `You are a senior MUN chair scoring a delegate's GSL speech on a 0-10 scale.
Evaluate: substance, diplomatic tone, factual accuracy, alignment with country foreign policy, structure.
Return concise feedback (max 60 words) and a single integer score 0-10.
Do NOT inflate scores; reserve 9-10 for genuinely outstanding speeches.`;

    const user = `Country: ${country || "Unknown"}
Agenda: ${agenda || "Unspecified"}

Speech:
"""
${speech_text.slice(0, 6000)}
"""`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        tools: [{
          type: "function",
          function: {
            name: "submit_score",
            description: "Submit speech evaluation",
            parameters: {
              type: "object",
              properties: {
                score: { type: "integer", minimum: 0, maximum: 10 },
                feedback: { type: "string" },
              },
              required: ["score", "feedback"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_score" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      const status = aiRes.status === 429 ? 429 : aiRes.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: "AI request failed", detail: errText }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    let score = 5, feedback = "No feedback returned.";
    if (call?.function?.arguments) {
      try {
        const parsed = JSON.parse(call.function.arguments);
        score = Math.max(0, Math.min(10, parseInt(parsed.score) || 0));
        feedback = (parsed.feedback || "").toString().slice(0, 600);
      } catch (_e) { /* keep defaults */ }
    }

    return new Response(JSON.stringify({ score, ai_feedback: feedback }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
