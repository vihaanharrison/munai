import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Mic, Users, AlertTriangle, X, Minimize2 } from "lucide-react";

interface Props {
  committeeId: string;
}

interface Active {
  gsl?: { delegate_id: string; started_at: string; duration: number };
  mod?: { topic: string; started_at?: string; duration?: number };
  unmod?: { topic: string; started_at?: string; duration: number };
}

const fmt = (s: number) => {
  if (s < 0) s = 0;
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
};

const LiveTimers = ({ committeeId }: Props) => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [active, setActive] = useState<Active>({});
  const [now, setNow] = useState(Date.now());
  const [delegateMap, setDelegateMap] = useState<Record<string, string>>({});

  const refresh = async () => {
    const [gslRes, modRes, unmodRes, delRes] = await Promise.all([
      supabase.from("speakers_list").select("*").eq("committee_id", committeeId).eq("status", "speaking").maybeSingle() as any,
      supabase.from("mod_caucus").select("*").eq("committee_id", committeeId).eq("active", true).maybeSingle() as any,
      supabase.from("unmod_caucus").select("*").eq("committee_id", committeeId).eq("active", true).maybeSingle() as any,
      supabase.from("delegates").select("id,country").eq("committee_id", committeeId) as any,
    ]);
    const map: Record<string, string> = {};
    (delRes.data || []).forEach((d: any) => { map[d.id] = d.country; });
    setDelegateMap(map);
    setActive({
      gsl: gslRes.data ? { delegate_id: gslRes.data.delegate_id, started_at: gslRes.data.started_at, duration: gslRes.data.duration_seconds || 120 } : undefined,
      mod: modRes.data ? { topic: modRes.data.topic, started_at: modRes.data.created_at } : undefined,
      unmod: unmodRes.data ? { topic: unmodRes.data.topic, started_at: unmodRes.data.started_at || unmodRes.data.created_at, duration: unmodRes.data.duration_seconds || 600 } : undefined,
    });
  };

  useEffect(() => {
    refresh();
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const ch = supabase
      .channel(`live-timers-${committeeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "speakers_list", filter: `committee_id=eq.${committeeId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "mod_caucus", filter: `committee_id=eq.${committeeId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "unmod_caucus", filter: `committee_id=eq.${committeeId}` }, refresh)
      .subscribe();
    return () => { clearInterval(tick); supabase.removeChannel(ch); };
  }, [committeeId]);

  const gslLeft = active.gsl?.started_at ? active.gsl.duration - Math.floor((now - new Date(active.gsl.started_at).getTime()) / 1000) : 0;
  const unmodLeft = active.unmod?.started_at ? (active.unmod.duration || 600) - Math.floor((now - new Date(active.unmod.started_at).getTime()) / 1000) : 0;
  const anyActive = !!(active.gsl || active.mod || active.unmod);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-40 w-12 h-12 rounded-full glass-card-elevated shadow-elevated flex items-center justify-center hover:scale-105 transition-transform"
        title="Live Timers"
      >
        <Clock className={`w-5 h-5 ${anyActive ? "text-accent animate-pulse" : "text-primary"}`} />
        {anyActive && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full animate-pulse" />}
      </button>
    );
  }

  if (minimized) {
    return (
      <div className="fixed bottom-24 right-6 z-40 glass-card rounded-2xl shadow-elevated px-3 py-2 flex items-center gap-2 cursor-pointer" onClick={() => setMinimized(false)}>
        <Clock className="w-4 h-4 text-accent" />
        <span className="text-xs font-medium text-foreground">{active.gsl ? fmt(gslLeft) : active.unmod ? fmt(unmodLeft) : "Timers"}</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-40 glass-card-elevated rounded-2xl shadow-elevated w-72">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Live Timers</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(true)} className="p-1 rounded hover:bg-secondary"><Minimize2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-secondary"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <Row icon={<Mic className="w-4 h-4" />} label="GSL"
          primary={active.gsl ? (delegateMap[active.gsl.delegate_id] || "Speaking") : "Idle"}
          time={active.gsl ? fmt(gslLeft) : "—"} active={!!active.gsl} />
        <Row icon={<Users className="w-4 h-4" />} label="Mod Caucus"
          primary={active.mod?.topic || "Idle"} time={active.mod ? "Live" : "—"} active={!!active.mod} />
        <Row icon={<Users className="w-4 h-4" />} label="Unmod Caucus"
          primary={active.unmod?.topic || "Idle"} time={active.unmod ? fmt(unmodLeft) : "—"} active={!!active.unmod} />
      </div>
    </div>
  );
};

const Row = ({ icon, label, primary, time, active }: any) => (
  <div className={`rounded-xl px-3 py-2 flex items-center justify-between ${active ? "bg-primary/10" : "bg-secondary/40"}`}>
    <div className="flex items-center gap-2 min-w-0">
      <span className={active ? "text-accent" : "text-muted-foreground"}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-xs font-medium text-foreground truncate">{primary}</p>
      </div>
    </div>
    <span className={`text-sm font-mono font-bold ${active ? "text-primary" : "text-muted-foreground"}`}>{time}</span>
  </div>
);

export default LiveTimers;
