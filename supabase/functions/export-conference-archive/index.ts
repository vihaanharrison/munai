import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { conferenceId, standaloneCommitteeId } = await req.json();
    if (!conferenceId && !standaloneCommitteeId) {
      return new Response(JSON.stringify({ error: "conferenceId or standaloneCommitteeId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const zip = new JSZip();

    const csvOf = (rows: any[]) => {
      if (!rows || !rows.length) return "";
      const keys = Object.keys(rows[0]);
      const escape = (v: any) => {
        if (v === null || v === undefined) return "";
        const s = typeof v === "object" ? JSON.stringify(v) : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      };
      return [keys.join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join("\n");
    };

    const addTable = async (table: string, filter: { col: string; val: string }, folder = "") => {
      const { data, error } = await supabase.from(table).select("*").eq(filter.col, filter.val) as any;
      if (error) return;
      if (data && data.length) zip.file(`${folder}${table}.csv`, csvOf(data));
      zip.file(`${folder}${table}.json`, JSON.stringify(data || [], null, 2));
    };

    if (conferenceId) {
      const { data: conf } = await supabase.from("conferences").select("*").eq("id", conferenceId).single() as any;
      if (!conf) return new Response(JSON.stringify({ error: "Conference not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      zip.file("conference.json", JSON.stringify(conf, null, 2));
      const tables = ["committees", "committee_agendas", "committee_files", "delegates", "speakers_list", "pois", "blocs", "delegate_blocs", "delegate_documents", "conference_updates", "schedule_sessions", "audit_logs", "crisis_triggers", "custom_tab_entries", "mod_caucus", "unmod_caucus"];
      for (const t of tables) await addTable(t, { col: "conference_id", val: conferenceId });
    } else if (standaloneCommitteeId) {
      const { data: sc } = await supabase.from("standalone_committees").select("*").eq("id", standaloneCommitteeId).single() as any;
      if (!sc) return new Response(JSON.stringify({ error: "Committee not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      zip.file("committee.json", JSON.stringify(sc, null, 2));
      const tables = ["committee_agendas", "committee_files", "delegates", "speakers_list", "pois", "blocs", "delegate_blocs", "delegate_documents", "crisis_triggers", "custom_tab_entries", "mod_caucus", "unmod_caucus"];
      for (const t of tables) await addTable(t, { col: "committee_id", val: standaloneCommitteeId });
    }

    zip.file("README.txt", `MUN AI Archive\nGenerated: ${new Date().toISOString()}\n\nThis archive contains a snapshot of all conference data as CSV and JSON files.\n`);

    const blob = await zip.generateAsync({ type: "uint8array" });
    return new Response(blob, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="munai-archive-${Date.now()}.zip"`,
      },
    });
  } catch (e: any) {
    console.error("archive error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
