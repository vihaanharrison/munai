import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find conferences that ended more than 24 hours ago
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const { data: expiredConferences, error: confError } = await supabase
      .from("conferences")
      .select("id, name, end_date")
      .lt("end_date", cutoff);

    if (confError) throw confError;
    if (!expiredConferences || expiredConferences.length === 0) {
      return new Response(JSON.stringify({ message: "No expired conferences to purge" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const purgedIds: string[] = [];

    for (const conf of expiredConferences) {
      const confId = conf.id;

      // Delete delegate documents
      await supabase.from("delegate_documents").delete().eq("conference_id", confId);

      // Delete delegate blocs
      await supabase.from("delegate_blocs").delete().eq("conference_id", confId);

      // Delete POIs
      await supabase.from("pois").delete().eq("conference_id", confId);

      // Delete speakers list
      await supabase.from("speakers_list").delete().eq("conference_id", confId);

      // Delete blocs
      await supabase.from("blocs").delete().eq("conference_id", confId);

      // Delete mod caucus
      await supabase.from("mod_caucus").delete().eq("conference_id", confId);

      // Delete crisis triggers
      await supabase.from("crisis_triggers").delete().eq("conference_id", confId);

      // Delete committee files
      await supabase.from("committee_files").delete().eq("conference_id", confId);

      // Delete committee agendas
      await supabase.from("committee_agendas").delete().eq("conference_id", confId);

      // Delete delegates (marks, uploads etc.)
      await supabase.from("delegates").delete().eq("conference_id", confId);

      // Delete chair sessions
      await supabase.from("chair_sessions").delete().eq("conference_id", confId);

      // Log the purge
      await supabase.rpc("log_audit_event", {
        p_conference_id: confId,
        p_action: "data_purge",
        p_actor_type: "system",
        p_details: { conference_name: conf.name, end_date: conf.end_date },
      });

      purgedIds.push(confId);
    }

    // Also purge storage files for these conferences
    for (const confId of purgedIds) {
      const { data: files } = await supabase.storage
        .from("conference-files")
        .list(confId);
      if (files && files.length > 0) {
        const paths = files.map((f) => `${confId}/${f.name}`);
        await supabase.storage.from("conference-files").remove(paths);
      }
    }

    return new Response(
      JSON.stringify({ message: `Purged ${purgedIds.length} expired conferences`, ids: purgedIds }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Purge error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
