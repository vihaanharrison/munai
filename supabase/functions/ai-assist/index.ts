import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, content, delegations, columns, chairFeedback, delegateName, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const callAI = async (systemPrompt: string, userPrompt: string) => {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!resp.ok) {
        const status = resp.status;
        if (status === 429) return { error: "Rate limited. Please try again shortly." };
        if (status === 402) return { error: "AI credits exhausted. Please add funds." };
        throw new Error(`AI gateway error: ${status}`);
      }

      const data = await resp.json();
      return { reply: data.choices?.[0]?.message?.content || "" };
    };

    // Score command parsing with tool calling
    if (type === "score-command") {
      const delegationList = (delegations || []).map((d: any) => `${d.country} (${d.name}, id: ${d.id})`).join("\n");
      const colList = (columns || []).join(", ");

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You parse natural language MUN scoring commands. Available delegations:\n${delegationList}\n\nAvailable scoring columns: ${colList}\n\nUse FUZZY MATCHING to find the closest delegation name. "Modi" matches the Modi delegation specifically, NOT India. "USA" matches United States. Always resolve to the EXACT delegation in the list.\n\nIf no specific column is mentioned, distribute points to the first/default column.\nIf the command says "deduct" or "minus" or "-", set action to "deduct".`,
            },
            { role: "user", content: content },
          ],
          tools: [{
            type: "function",
            function: {
              name: "apply_score",
              description: "Apply a score change to a delegate",
              parameters: {
                type: "object",
                properties: {
                  delegateId: { type: "string", description: "The delegate's UUID" },
                  column: { type: "string", description: "Scoring column name" },
                  points: { type: "number", description: "Points to add (positive number)" },
                  action: { type: "string", enum: ["add", "deduct"], description: "Whether to add or deduct" },
                },
                required: ["delegateId", "column", "points", "action"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "apply_score" } },
        }),
      });

      if (!resp.ok) {
        return new Response(JSON.stringify({ error: "AI parsing failed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await resp.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const args = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(args), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ message: "Could not parse command" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GSL scoring
    if (type === "gsl-score") {
      const result = await callAI(
        `You are an MUN GSL speech scorer. Score the speech on a 0-20 scale based on content quality, diplomacy, research depth, and delivery. The chair has provided feedback. Return ONLY a JSON object: {"score": number, "feedback": "brief explanation"}`,
        `Delegate: ${delegateName}\n\nSpeech:\n${content}\n\nChair Feedback:\n${chairFeedback}`
      );
      if (result.error) return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      try {
        const parsed = JSON.parse(result.reply!.replace(/```json\n?/g, "").replace(/```/g, "").trim());
        return new Response(JSON.stringify({ score: parsed.score || 0, feedback: parsed.feedback || "" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ score: 10, feedback: result.reply }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Crisis summary
    if (type === "crisis-summary") {
      const result = await callAI(
        "You are an MUN crisis analyst. Summarize the crisis trigger concisely for delegates. Keep it under 200 words. Focus on key events, stakeholders, and immediate implications.",
        content
      );
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI integrity check
    if (type === "ai-check") {
      const result = await callAI(
        `You are an AI content detector for MUN speeches. Analyze the text and estimate what percentage is AI-generated vs human-written. Return ONLY a JSON object: {"ai_percentage": number, "is_acceptable": boolean, "explanation": "brief reason"}. A speech is acceptable if AI content is 10% or less.`,
        content
      );
      if (result.error) return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      try {
        const parsed = JSON.parse(result.reply!.replace(/```json\n?/g, "").replace(/```/g, "").trim());
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ ai_percentage: 0, is_acceptable: true, explanation: result.reply }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // General assistant - streaming
    if (type === "chat" || type === "analyze" || type === "draft" || type === "score-suggestion" || !type) {
      let systemPrompt = "You are MUN AI, an expert Model United Nations assistant.";
      if (type === "analyze" || type === "speech-analysis") {
        systemPrompt = "You are an MUN speech coach. Analyze the speech for strength, areas of improvement, diplomatic language usage, and factual accuracy.";
      } else if (type === "draft" || type === "resolution-draft") {
        systemPrompt = "You are an MUN resolution drafter. Draft a formal UN resolution with preambulatory and operative clauses.";
      } else if (type === "score-suggestion") {
        systemPrompt = "You are a MUN scoring assistant. Suggest scores (1-10) for Content, Diplomacy, Speaking, and Participation.";
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: content || (messages || []).map((m: any) => `${m.role}: ${m.content}`).join("\n") },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI error: ${response.status}`);
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
