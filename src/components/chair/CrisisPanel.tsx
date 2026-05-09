import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertTriangle, Upload, Loader2, FileText } from "lucide-react";

interface Props {
  committeeId: string;
  conferenceId: string;
  committee: any;
}

const CrisisPanel = ({ committeeId, conferenceId, committee }: Props) => {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [newContent, setNewContent] = useState("");
  const [uploading, setUploading] = useState(false);

  const loadTriggers = useCallback(async () => {
    const { data } = await supabase
      .from("crisis_triggers")
      .select("*")
      .eq("committee_id", committeeId)
      .order("created_at", { ascending: false }) as any;
    setTriggers(data || []);
  }, [committeeId]);

  useEffect(() => { loadTriggers(); }, [loadTriggers]);

  const uploadTrigger = async () => {
    if (!newContent.trim()) { toast.error("Enter crisis trigger content"); return; }
    setUploading(true);
    try {
      // Get AI summary
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ type: "crisis-summary", content: newContent }),
      });
      const result = await resp.json();
      const aiSummary = result.reply || result.summary || "Summary unavailable";

      await supabase.from("crisis_triggers").insert({
        committee_id: committeeId,
        conference_id: conferenceId,
        content: newContent.trim(),
        ai_summary: aiSummary,
      } as any);

      // If first trigger and no agenda exists, create agenda from summary
      if (triggers.length === 0) {
        await supabase.from("committee_agendas").insert({
          committee_id: committeeId,
          conference_id: conferenceId,
          name: "Crisis Response",
          description: aiSummary,
          ai_summary: aiSummary,
          is_crisis_trigger: true,
          sort_order: 0,
        } as any);
      }

      setNewContent("");
      loadTriggers();
      toast.success("Crisis trigger uploaded with AI summary");
    } catch {
      toast.error("Failed to upload trigger");
    } finally {
      setUploading(false);
    }
  };

  const crisisOn = !!committee?.crisis_enabled || !!committee?.crisis_mode_active || committee?.committee_type === "crisis";
  if (!crisisOn) {
    return (
      <div className="glass-card rounded-2xl p-5 text-center">
        <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Crisis mode is not enabled for this committee.</p>
        <p className="text-xs text-muted-foreground mt-1">Toggle the Crisis button in the header to enable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Trigger */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-destructive" /> Upload Crisis Trigger
        </h2>
        <Textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Paste or type the crisis trigger content..."
          className="rounded-xl min-h-[100px] mb-3"
        />
        <Button onClick={uploadTrigger} disabled={uploading} className="w-full rounded-xl gradient-primary border-0 font-semibold">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
          Upload & Generate AI Summary
        </Button>
      </div>

      {/* Trigger History */}
      {triggers.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-semibold text-foreground text-sm mb-3">Crisis Timeline ({triggers.length})</h2>
          <div className="space-y-3">
            {triggers.map((t: any, i: number) => (
              <div key={t.id} className="bg-secondary/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-destructive">Trigger #{triggers.length - i}</span>
                  <span className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</span>
                </div>
                {t.ai_summary && (
                  <div className="bg-accent/10 rounded-lg px-3 py-2 mb-2">
                    <p className="text-xs font-medium text-accent mb-0.5">AI Summary</p>
                    <p className="text-sm text-foreground">{t.ai_summary}</p>
                  </div>
                )}
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground">View full trigger content</summary>
                  <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{t.content}</p>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrisisPanel;
