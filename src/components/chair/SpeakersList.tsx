import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Play, SkipForward, Plus, Mic, Trash2, Pause } from "lucide-react";
import ScoreSpeechModal from "./ScoreSpeechModal";

interface Props {
  committeeId: string;
  conferenceId: string;
  delegates: any[];
  onDelegatesUpdated: () => void;
}

const SpeakersList = ({ committeeId, conferenceId, delegates, onDelegatesUpdated }: Props) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [listType, setListType] = useState<string>("gsl");
  const [addDelegateId, setAddDelegateId] = useState("");
  const [duration, setDuration] = useState(120);
  const [now, setNow] = useState(Date.now());
  const [paused, setPaused] = useState(false);
  const [pausedRemaining, setPausedRemaining] = useState<number | null>(null);

  // Mod caucus
  const [modTopic, setModTopic] = useState("");
  const [activeModCaucus, setActiveModCaucus] = useState<any>(null);

  // GSL scoring
  const [showScorePrompt, setShowScorePrompt] = useState(false);
  const [scoringEntry, setScoringEntry] = useState<any>(null);
  const [latestSpeechText, setLatestSpeechText] = useState("");
  const promptedRef = useRef<Set<string>>(new Set());

  const approvedDelegates = delegates.filter((d) => d.approved);

  const loadEntries = useCallback(async () => {
    const { data } = await supabase
      .from("speakers_list")
      .select("*")
      .eq("committee_id", committeeId)
      .eq("list_type", listType)
      .order("position") as any;
    setEntries(data || []);
  }, [committeeId, listType]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  useEffect(() => {
    const channel = supabase
      .channel(`speakers-rt-${committeeId}-${listType}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "speakers_list", filter: `committee_id=eq.${committeeId}` }, () => loadEntries())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [committeeId, listType, loadEntries]);

  // Active mod caucus
  useEffect(() => {
    if (listType !== "modcaucus") return;
    supabase.from("mod_caucus").select("*").eq("committee_id", committeeId).eq("active", true).maybeSingle().then(({ data }: any) => {
      setActiveModCaucus(data);
    });
  }, [listType, committeeId]);

  // Single ticking clock — drives timer display from server-side started_at
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const speaking = entries.find((e) => e.status === "speaking");
  const upcoming = entries.filter((e) => e.status === "upcoming").sort((a, b) => a.position - b.position);
  const done = entries.filter((e) => e.status === "done");

  const totalDur = speaking?.duration_seconds || duration;
  const elapsed = speaking?.started_at ? Math.floor((now - new Date(speaking.started_at).getTime()) / 1000) : 0;
  const computedLeft = Math.max(0, totalDur - elapsed);
  const timeLeft = paused && pausedRemaining != null ? pausedRemaining : computedLeft;

  const getDName = (id: string) => approvedDelegates.find((d) => d.id === id)?.country || "Unknown";

  const openScoringModal = useCallback(async (entry: any) => {
    setScoringEntry(entry);
    const { data: docs } = await supabase.from("delegate_documents").select("*")
      .eq("delegate_id", entry.delegate_id).eq("doc_type", "gsl_speech")
      .order("created_at", { ascending: false }).limit(1) as any;
    setLatestSpeechText(docs?.[0]?.content || "");
    setShowScorePrompt(true);
  }, []);

  // Auto-prompt scoring once when GSL timer hits 0
  useEffect(() => {
    if (!speaking || listType !== "gsl" || paused) return;
    if (computedLeft === 0 && !promptedRef.current.has(speaking.id)) {
      promptedRef.current.add(speaking.id);
      openScoringModal(speaking);
    }
  }, [computedLeft, speaking, listType, paused, openScoringModal]);

  const addSpeaker = async () => {
    if (!addDelegateId) { toast.error("Select a delegate first"); return; }
    const maxPos = entries.length > 0 ? Math.max(...entries.map((e) => e.position)) + 1 : 0;
    const { error } = await supabase.from("speakers_list").insert({
      committee_id: committeeId,
      conference_id: conferenceId,
      list_type: listType,
      delegate_id: addDelegateId,
      position: maxPos,
      duration_seconds: duration,
      status: "upcoming",
    } as any);
    if (error) { toast.error(error.message); return; }
    setAddDelegateId("");
    loadEntries();
  };

  const startNextSpeaker = async () => {
    setPaused(false); setPausedRemaining(null);
    if (speaking) {
      await supabase.from("speakers_list").update({ status: "done" } as any).eq("id", speaking.id);
    }
    const next = upcoming[0];
    if (next) {
      await supabase.from("speakers_list").update({ status: "speaking", started_at: new Date().toISOString() } as any).eq("id", next.id);
    } else {
      toast.info("No more speakers in the list");
    }
    loadEntries();
  };

  const pauseResume = async () => {
    if (!speaking) return;
    if (!paused) {
      setPausedRemaining(computedLeft);
      setPaused(true);
    } else {
      const remaining = pausedRemaining ?? computedLeft;
      const newStart = new Date(Date.now() - (totalDur - remaining) * 1000).toISOString();
      await supabase.from("speakers_list").update({ started_at: newStart } as any).eq("id", speaking.id);
      setPaused(false); setPausedRemaining(null);
    }
  };

  const removeSpeaker = async (id: string) => {
    await supabase.from("speakers_list").delete().eq("id", id);
    loadEntries();
  };

  const startModCaucus = async () => {
    if (!modTopic.trim()) { toast.error("Enter a topic"); return; }
    await supabase.from("mod_caucus").update({ active: false } as any).eq("committee_id", committeeId).eq("active", true);
    const { data } = await supabase.from("mod_caucus").insert({
      committee_id: committeeId,
      conference_id: conferenceId,
      topic: modTopic.trim(),
      active: true,
    } as any).select().single();
    setActiveModCaucus(data);
    setModTopic("");
    toast.success("Moderated caucus started");
  };

  const onScoreSubmitted = async (score: number) => {
    if (!scoringEntry) return;
    const delegate = approvedDelegates.find((d) => d.id === scoringEntry.delegate_id);
    if (delegate) {
      const marks = { ...(delegate.marks || {}) };
      marks.Speaking = (marks.Speaking || 0) + score;
      await supabase.from("delegates").update({ marks } as any).eq("id", delegate.id);
      onDelegatesUpdated();
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      <ScoreSpeechModal
        open={showScorePrompt}
        onClose={() => { setShowScorePrompt(false); setScoringEntry(null); }}
        scoringEntry={scoringEntry}
        delegateName={scoringEntry ? getDName(scoringEntry.delegate_id) : ""}
        speechText={latestSpeechText}
        onSubmitted={onScoreSubmitted}
      />

      <div className="glass-card rounded-2xl p-5">
        <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-4">
          {["gsl", "modcaucus", "crisis"].map((t) => (
            <button key={t} onClick={() => setListType(t)}
              className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${listType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
              {t === "gsl" ? "GSL" : t === "modcaucus" ? "Mod Caucus" : "Crisis"}
            </button>
          ))}
        </div>

        {listType === "modcaucus" && (
          <div className="mb-4">
            {activeModCaucus && (
              <div className="bg-accent/10 rounded-xl px-4 py-2 mb-2">
                <p className="text-xs text-accent font-medium">Active Topic: {activeModCaucus.topic}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Input value={modTopic} onChange={(e) => setModTopic(e.target.value)} placeholder="Caucus topic..." className="rounded-xl flex-1 text-sm" />
              <Button size="sm" onClick={startModCaucus} className="rounded-lg gradient-primary border-0 text-xs">Start</Button>
            </div>
          </div>
        )}

        {speaking && (
          <div className="bg-primary/10 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary animate-pulse" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{getDName(speaking.delegate_id)}</p>
                  <p className="text-xs text-muted-foreground">{paused ? "Paused" : "Speaking now"}</p>
                </div>
              </div>
              <div className={`text-2xl font-mono font-bold ${timeLeft === 0 ? "text-destructive" : "text-primary"}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <Button onClick={startNextSpeaker} className="rounded-xl gradient-primary border-0 flex-1 text-sm">
            <SkipForward className="w-4 h-4 mr-2" /> {speaking ? "Next Speaker" : "Start"}
          </Button>
          {speaking && (
            <Button variant="outline" onClick={pauseResume} className="rounded-xl text-sm">
              {paused ? <><Play className="w-4 h-4 mr-1" /> Resume</> : <><Pause className="w-4 h-4 mr-1" /> Pause</>}
            </Button>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <Select value={addDelegateId} onValueChange={setAddDelegateId}>
            <SelectTrigger className="rounded-xl flex-1 text-sm"><SelectValue placeholder={approvedDelegates.length === 0 ? "No approved delegates" : "Add delegate..."} /></SelectTrigger>
            <SelectContent>
              {approvedDelegates.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.country} — {d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 60)} className="w-20 rounded-xl text-sm" placeholder="sec" />
          <Button onClick={addSpeaker} disabled={!addDelegateId} className="rounded-xl gradient-primary border-0"><Plus className="w-4 h-4" /></Button>
        </div>

        {upcoming.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Upcoming ({upcoming.length})</p>
            {upcoming.map((e, i) => (
              <div key={e.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-3 py-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                  <span className="text-sm font-medium text-foreground">{getDName(e.delegate_id)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{e.duration_seconds}s</span>
                  <button onClick={() => removeSpeaker(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {done.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Completed ({done.length})</p>
            {done.map((e) => (
              <div key={e.id} className="flex items-center justify-between bg-secondary/30 rounded-xl px-3 py-2 mb-1 opacity-60">
                <span className="text-sm text-foreground">{getDName(e.delegate_id)}</span>
                {e.ai_score != null && <span className="text-xs text-accent font-medium">{e.ai_score}/20</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeakersList;
