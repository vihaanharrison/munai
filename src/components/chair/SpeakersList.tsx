import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Play, SkipForward, Plus, Clock, Mic, Check, Trash2, Loader2 } from "lucide-react";
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
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Mod caucus
  const [modTopic, setModTopic] = useState("");
  const [activeModCaucus, setActiveModCaucus] = useState<any>(null);

  // GSL scoring
  const [showScorePrompt, setShowScorePrompt] = useState(false);
  const [chairFeedback, setChairFeedback] = useState("");
  const [scoringEntry, setScoringEntry] = useState<any>(null);
  const [scoreLoading, setScoreLoading] = useState(false);

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
      .channel("speakers-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "speakers_list", filter: `committee_id=eq.${committeeId}` }, () => loadEntries())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [committeeId, loadEntries]);

  // Load active mod caucus
  useEffect(() => {
    if (listType === "modcaucus") {
      supabase.from("mod_caucus").select("*").eq("committee_id", committeeId).eq("active", true).maybeSingle().then(({ data }) => {
        setActiveModCaucus(data);
      });
    }
  }, [listType, committeeId]);

  // Timer
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setTimerActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Prompt for GSL scoring
            const speaking = entries.find((e) => e.status === "speaking");
            if (speaking && listType === "gsl") {
              openScoringModal(speaking);
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive, timeLeft]);

  const addSpeaker = async () => {
    if (!addDelegateId) return;
    const maxPos = entries.length > 0 ? Math.max(...entries.map((e) => e.position)) + 1 : 0;
    await supabase.from("speakers_list").insert({
      committee_id: committeeId,
      conference_id: conferenceId,
      list_type: listType,
      delegate_id: addDelegateId,
      position: maxPos,
      duration_seconds: duration,
      status: "upcoming",
    } as any);
    setAddDelegateId("");
    loadEntries();
  };

  const startNextSpeaker = async () => {
    // Mark current speaking as done
    const speaking = entries.find((e) => e.status === "speaking");
    if (speaking) {
      await supabase.from("speakers_list").update({ status: "done" } as any).eq("id", speaking.id);
    }
    // Find next upcoming
    const next = entries.filter((e) => e.status === "upcoming").sort((a, b) => a.position - b.position)[0];
    if (next) {
      await supabase.from("speakers_list").update({ status: "speaking", started_at: new Date().toISOString() } as any).eq("id", next.id);
      setTimeLeft(next.duration_seconds || duration);
      setTimerActive(true);
    } else {
      toast.info("No more speakers in the list");
    }
    loadEntries();
  };

  const removeSpeaker = async (id: string) => {
    await supabase.from("speakers_list").delete().eq("id", id);
    loadEntries();
  };

  const startModCaucus = async () => {
    if (!modTopic.trim()) { toast.error("Enter a topic"); return; }
    // End any active mod caucus
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

  const [latestSpeechText, setLatestSpeechText] = useState("");
  const openScoringModal = async (entry: any) => {
    setScoringEntry(entry);
    const { data: docs } = await supabase.from("delegate_documents").select("*")
      .eq("delegate_id", entry.delegate_id).eq("doc_type", "gsl_speech")
      .order("created_at", { ascending: false }).limit(1) as any;
    setLatestSpeechText(docs?.[0]?.content || "");
    setShowScorePrompt(true);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const speaking = entries.find((e) => e.status === "speaking");
  const upcoming = entries.filter((e) => e.status === "upcoming").sort((a, b) => a.position - b.position);
  const done = entries.filter((e) => e.status === "done");
  const getDName = (id: string) => {
    const d = approvedDelegates.find((d) => d.id === id);
    return d ? `${d.country}` : "Unknown";
  };

  return (
    <div className="space-y-4">
      {/* GSL Score Prompt */}
      {showScorePrompt && scoringEntry && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowScorePrompt(false)}>
          <div className="glass-card rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-bold text-foreground mb-2">Score GSL Speech</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Delegate: <strong>{getDName(scoringEntry.delegate_id)}</strong>
            </p>
            <Textarea
              value={chairFeedback}
              onChange={(e) => setChairFeedback(e.target.value)}
              placeholder="Your feedback on the speech..."
              className="rounded-xl min-h-[80px] mb-3"
            />
            <p className="text-xs text-muted-foreground mb-3">AI will generate a score (0-20) based on your feedback and the speech content.</p>
            <Button onClick={submitGslScore} disabled={scoreLoading || !chairFeedback.trim()} className="w-full rounded-xl gradient-primary border-0">
              {scoreLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Submit Score
            </Button>
          </div>
        </div>
      )}

      {/* List Type Selector */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-4">
          {["gsl", "modcaucus", "crisis"].map((t) => (
            <button key={t} onClick={() => setListType(t)}
              className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${listType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
              {t === "gsl" ? "GSL" : t === "modcaucus" ? "Mod Caucus" : "Crisis"}
            </button>
          ))}
        </div>

        {/* Mod Caucus Topic */}
        {listType === "modcaucus" && (
          <div className="mb-4">
            {activeModCaucus ? (
              <div className="bg-accent/10 rounded-xl px-4 py-2 mb-2">
                <p className="text-xs text-accent font-medium">Active Topic: {activeModCaucus.topic}</p>
              </div>
            ) : null}
            <div className="flex gap-2">
              <Input value={modTopic} onChange={(e) => setModTopic(e.target.value)} placeholder="Caucus topic..." className="rounded-xl flex-1 text-sm" />
              <Button size="sm" onClick={startModCaucus} className="rounded-lg gradient-primary border-0 text-xs">Start</Button>
            </div>
          </div>
        )}

        {/* Current Speaker */}
        {speaking && (
          <div className="bg-primary/10 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary animate-pulse" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{getDName(speaking.delegate_id)}</p>
                  <p className="text-xs text-muted-foreground">Speaking now</p>
                </div>
              </div>
              <div className="text-2xl font-mono font-bold text-primary">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2 mb-4">
          <Button onClick={startNextSpeaker} className="rounded-xl gradient-primary border-0 flex-1 text-sm">
            <SkipForward className="w-4 h-4 mr-2" /> {speaking ? "Next Speaker" : "Start"}
          </Button>
          {timerActive && (
            <Button variant="outline" onClick={() => setTimerActive(false)} className="rounded-xl text-sm">
              Pause
            </Button>
          )}
          {!timerActive && timeLeft > 0 && (
            <Button variant="outline" onClick={() => setTimerActive(true)} className="rounded-xl text-sm">
              <Play className="w-4 h-4 mr-1" /> Resume
            </Button>
          )}
        </div>

        {/* Add Speaker */}
        <div className="flex gap-2 mb-4">
          <Select value={addDelegateId} onValueChange={setAddDelegateId}>
            <SelectTrigger className="rounded-xl flex-1 text-sm"><SelectValue placeholder="Add delegate..." /></SelectTrigger>
            <SelectContent>
              {approvedDelegates.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.country} — {d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 60)} className="w-20 rounded-xl text-sm" placeholder="sec" />
          <Button onClick={addSpeaker} className="rounded-xl gradient-primary border-0"><Plus className="w-4 h-4" /></Button>
        </div>

        {/* Upcoming */}
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

        {/* Done */}
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
