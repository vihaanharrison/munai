import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, X, Search, MessageSquare } from "lucide-react";

interface Props {
  committeeId: string;
  conferenceId: string;
  delegates: any[];
}

const ChairPOIPanel = ({ committeeId, conferenceId, delegates }: Props) => {
  const [pois, setPois] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const loadPois = useCallback(async () => {
    const { data } = await supabase
      .from("pois")
      .select("*")
      .eq("committee_id", committeeId)
      .order("created_at", { ascending: false }) as any;
    setPois(data || []);
  }, [committeeId]);

  useEffect(() => { loadPois(); }, [loadPois]);

  useEffect(() => {
    const channel = supabase
      .channel("chair-pois")
      .on("postgres_changes", { event: "*", schema: "public", table: "pois", filter: `committee_id=eq.${committeeId}` }, () => loadPois())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [committeeId, loadPois]);

  const getDelegateName = (id: string) => delegates.find((d) => d.id === id)?.name || "Unknown";
  const getDelegateCountry = (id: string) => delegates.find((d) => d.id === id)?.country || "";

  const approvePoi = async (poiId: string) => {
    await supabase.from("pois").update({ status: "approved" } as any).eq("id", poiId);
    const poi = pois.find((p) => p.id === poiId);
    if (poi) {
      const delegate = delegates.find((d) => d.id === poi.from_delegate_id);
      if (delegate) {
        const marks = { ...(delegate.marks || {}) };
        marks.POIs = (marks.POIs || 0) + 1;
        await supabase.from("delegates").update({ marks } as any).eq("id", delegate.id);
      }
      await supabase.rpc("log_audit_event", {
        p_conference_id: conferenceId, p_committee_id: committeeId,
        p_action: "poi_approved", p_actor_type: "chair",
        p_target_table: "pois", p_target_id: poiId,
        p_details: { from: getDelegateName(poi.from_delegate_id), to: getDelegateName(poi.to_delegate_id) },
      } as any);
    }
    loadPois();
    toast.success("POI approved & +1 point awarded");
  };

  const rejectPoi = async (poiId: string) => {
    await supabase.from("pois").update({ status: "rejected" } as any).eq("id", poiId);
    const poi = pois.find((p) => p.id === poiId);
    if (poi) {
      await supabase.rpc("log_audit_event", {
        p_conference_id: conferenceId, p_committee_id: committeeId,
        p_action: "poi_rejected", p_actor_type: "chair",
        p_target_table: "pois", p_target_id: poiId,
        p_details: { from: getDelegateName(poi.from_delegate_id), to: getDelegateName(poi.to_delegate_id) },
      } as any);
    }
    loadPois();
    toast.success("POI rejected");
  };

  const pending = pois.filter((p) => (p.status || "pending") === "pending");
  const processed = pois.filter((p) => p.status === "approved" || p.status === "rejected");

  const filtered = search.trim()
    ? processed.filter((p) => {
        const q = search.toLowerCase();
        return (
          getDelegateName(p.from_delegate_id).toLowerCase().includes(q) ||
          getDelegateName(p.to_delegate_id).toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          new Date(p.created_at).toLocaleString().includes(q)
        );
      })
    : processed;

  return (
    <div className="space-y-4">
      {/* Pending POIs */}
      {pending.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-destructive" /> Pending POIs ({pending.length})
          </h2>
          {pending.map((p: any) => (
            <div key={p.id} className="bg-secondary/50 rounded-xl px-4 py-3 mb-2">
              <p className="text-xs text-muted-foreground mb-1">
                <strong>{getDelegateName(p.from_delegate_id)}</strong> ({getDelegateCountry(p.from_delegate_id)}) → <strong>{getDelegateName(p.to_delegate_id)}</strong> ({getDelegateCountry(p.to_delegate_id)})
              </p>
              <p className="text-sm text-foreground mb-2">{p.content}</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => approvePoi(p.id)} className="rounded-lg gradient-primary border-0 text-xs h-7 px-3">
                  <Check className="w-3 h-3 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => rejectPoi(p.id)} className="rounded-lg text-xs h-7 px-3">
                  <X className="w-3 h-3 mr-1" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-accent" /> POI History ({processed.length})
        </h2>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by delegate, content, or date..."
          className="rounded-xl mb-3"
        />
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No POIs found.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.map((p: any) => (
              <div key={p.id} className="bg-secondary/50 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">
                    <strong>{getDelegateName(p.from_delegate_id)}</strong> → <strong>{getDelegateName(p.to_delegate_id)}</strong>
                  </p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === "approved" ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-sm text-foreground">{p.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(p.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChairPOIPanel;
