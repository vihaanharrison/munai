import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, BookOpen, FileText, Upload, Bell, CheckCircle2, MessageSquare, Mic, Users, Shield } from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";
import LiveConferenceClock from "@/components/LiveConferenceClock";

const DELEGATE_DEVICE_KEY = "munai_delegate_device";
function getDeviceId() {
  let id = localStorage.getItem(DELEGATE_DEVICE_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(DELEGATE_DEVICE_KEY, id); }
  return id;
}

type DelegateTab = "info" | "pois" | "speakers" | "blocs" | "updates";

const DelegateRegister = () => {
  const { conferenceId } = useParams<{ conferenceId: string }>();
  const [conference, setConference] = useState<any>(null);
  const [committees, setCommittees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"register" | "pending" | "dashboard">("register");
  const [delegate, setDelegate] = useState<any>(null);
  const [takenDelegations, setTakenDelegations] = useState<string[]>([]);
  const [tab, setTab] = useState<DelegateTab>("info");

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [committeeId, setCommitteeId] = useState("");

  // Documents
  const [gslText, setGslText] = useState("");
  const [gslSubmitting, setGslSubmitting] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);

  // Updates
  const [updates, setUpdates] = useState<any[]>([]);

  // POIs
  const [poiContent, setPoiContent] = useState("");
  const [poiTarget, setPoiTarget] = useState("");
  const [pois, setPois] = useState<any[]>([]);
  const [committeeDelegates, setCommitteeDelegates] = useState<any[]>([]);

  // Speakers list
  const [speakersEntries, setSpeakersEntries] = useState<any[]>([]);

  // Blocs
  const [blocs, setBlocs] = useState<any[]>([]);
  const [myBlocs, setMyBlocs] = useState<any[]>([]);

  useEffect(() => { loadData(); }, [conferenceId]);

  useEffect(() => {
    if (!delegate) return;
    const channel = supabase
      .channel("delegate-approval")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "delegates", filter: `id=eq.${delegate.id}` }, (payload) => {
        const updated = payload.new as any;
        setDelegate(updated);
        if (updated.approved && step === "pending") {
          setStep("dashboard");
          toast.success("You've been approved!");
          loadDashboardData();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [delegate?.id, step]);

  // Realtime for POIs and speakers
  useEffect(() => {
    if (!delegate?.committee_id) return;
    const channel = supabase
      .channel("delegate-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pois", filter: `committee_id=eq.${delegate.committee_id}` }, () => loadPois())
      .on("postgres_changes", { event: "*", schema: "public", table: "speakers_list", filter: `committee_id=eq.${delegate.committee_id}` }, () => loadSpeakers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [delegate?.committee_id]);

  const loadData = async () => {
    if (!conferenceId) return;
    const [confRes, comRes] = await Promise.all([
      supabase.from("conferences_public").select("*").eq("id", conferenceId).single(),
      supabase.from("committees").select("*").eq("conference_id", conferenceId),
    ]);
    setConference(confRes.data);
    setCommittees((comRes.data as any) || []);

    const deviceId = getDeviceId();
    const { data: existing } = await supabase
      .from("delegates").select("*")
      .eq("device_id", deviceId).eq("conference_id", conferenceId).eq("active", true)
      .maybeSingle() as any;

    if (existing) {
      setDelegate(existing);
      if (existing.approved) {
        setStep("dashboard");
        await loadDashboardData(existing);
      } else {
        setStep("pending");
      }
    }
    setLoading(false);
  };

  const loadDashboardData = async (del?: any) => {
    const d = del || delegate;
    if (!d) return;
    await Promise.all([
      loadDocs(d.id),
      loadUpdatesForCommittee(d.committee_id),
      loadCommitteeDelegates(d.committee_id),
      loadPois(d),
      loadSpeakers(d),
      loadBlocsData(d),
    ]);
  };

  const loadDelegationsForCommittee = async (comId: string) => {
    const { data } = await supabase.from("delegates").select("country").eq("committee_id", comId).eq("active", true) as any;
    setTakenDelegations((data || []).map((d: any) => d.country));
  };

  const loadDocs = async (delegateId?: string) => {
    const dId = delegateId || delegate?.id;
    if (!dId) return;
    const { data } = await supabase.from("delegate_documents").select("*").eq("delegate_id", dId) as any;
    setDocs(data || []);
  };

  const loadUpdatesForCommittee = async (comId: string) => {
    if (!conferenceId) return;
    const { data } = await supabase.from("conference_updates").select("*")
      .eq("conference_id", conferenceId)
      .or(`committee_id.eq.${comId},committee_id.is.null`)
      .order("created_at", { ascending: false }) as any;
    setUpdates(data || []);
  };

  const loadCommitteeDelegates = async (comId: string) => {
    const { data } = await supabase.from("delegates").select("*").eq("committee_id", comId).eq("approved", true).eq("active", true) as any;
    setCommitteeDelegates(data || []);
  };

  const loadPois = async (del?: any) => {
    const d = del || delegate;
    if (!d) return;
    const { data } = await supabase.from("pois").select("*")
      .or(`from_delegate_id.eq.${d.id},to_delegate_id.eq.${d.id}`)
      .order("created_at", { ascending: false }) as any;
    setPois(data || []);
  };

  const loadSpeakers = async (del?: any) => {
    const d = del || delegate;
    if (!d) return;
    const { data } = await supabase.from("speakers_list").select("*")
      .eq("committee_id", d.committee_id)
      .order("position") as any;
    setSpeakersEntries(data || []);
  };

  const loadBlocsData = async (del?: any) => {
    const d = del || delegate;
    if (!d) return;
    const [blocsRes, myBlocsRes] = await Promise.all([
      supabase.from("blocs").select("*").eq("committee_id", d.committee_id) as any,
      supabase.from("delegate_blocs").select("*").eq("delegate_id", d.id) as any,
    ]);
    setBlocs(blocsRes.data || []);
    setMyBlocs(myBlocsRes.data || []);
  };

  const handleRegister = async () => {
    if (!name.trim() || !country.trim() || !committeeId) {
      toast.error("Please fill in all fields"); return;
    }
    const deviceId = getDeviceId();
    const { data, error } = await supabase.from("delegates").insert({
      conference_id: conferenceId!, committee_id: committeeId,
      name: name.trim(), country: country.trim(),
      device_id: deviceId, active: true, approved: false,
    } as any).select().single();

    if (error) { toast.error(error.message); return; }
    setDelegate(data);
    setStep("pending");
    toast.success("Registration submitted! Waiting for chair approval.");
  };

  const submitGSL = async () => {
    if (!gslText.trim() || !delegate) return;
    setGslSubmitting(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ type: "ai-check", content: gslText }),
      });
      const result = await resp.json();
      if (result.ai_percentage > 10 || result.is_acceptable === false) {
        toast.error(`Speech rejected: ${result.ai_percentage}% AI-generated content detected. Must be ≤10%.`);
        return;
      }

      await supabase.from("delegate_documents").insert({
        delegate_id: delegate.id, committee_id: delegate.committee_id,
        conference_id: conferenceId!, doc_type: "gsl_speech",
        content: gslText.trim(), status: "pending", ai_check_result: result,
      } as any);
      setGslText("");
      loadDocs();
      toast.success("GSL speech submitted!");
    } catch {
      toast.error("Failed to submit");
    } finally {
      setGslSubmitting(false);
    }
  };

  const submitPOI = async () => {
    if (!poiContent.trim() || !poiTarget || !delegate) { toast.error("Select a recipient and write your POI"); return; }
    const toChair = poiTarget === "__chair__";
    await supabase.from("pois").insert({
      committee_id: delegate.committee_id, conference_id: conferenceId!,
      from_delegate_id: delegate.id,
      to_delegate_id: toChair ? delegate.id : poiTarget,
      to_chair: toChair,
      content: poiContent.trim(), status: "pending",
    } as any);
    setPoiContent("");
    setPoiTarget("");
    loadPois();
    toast.success("POI submitted for chair approval");
  };

  const joinBloc = async (blocId: string, blocName: string) => {
    if (!delegate) return;
    const already = myBlocs.find((m) => m.bloc_id === blocId || m.bloc_name === blocName);
    if (already) { toast.info("Already in this bloc"); return; }
    await supabase.from("delegate_blocs").insert({
      delegate_id: delegate.id, committee_id: delegate.committee_id,
      conference_id: conferenceId!, bloc_name: blocName, bloc_id: blocId,
    } as any);
    loadBlocsData();
    toast.success(`Joined ${blocName}`);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#efeeea] flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  if (step === "pending") {
    return (
      <div className="min-h-screen bg-[#efeeea] flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 text-center max-w-sm animate-fade-in">
          <img src={munLogo} alt="MUN AI" className="h-12 mx-auto mb-4" />
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <h2 className="font-display font-bold text-foreground text-lg mb-2">Pending Approval</h2>
          <p className="text-sm text-muted-foreground">
            Your registration as <strong>{delegate?.name}</strong> ({delegate?.country}) is awaiting chair approval.
          </p>
        </div>
      </div>
    );
  }

  if (step === "register") {
    const selectedCommittee = committees.find((c: any) => c.id === committeeId);
    const delegationList = selectedCommittee?.delegations
      ? selectedCommittee.delegations.split(",").map((d: string) => d.trim()).filter(Boolean)
      : [];
    const setupIncomplete = selectedCommittee && delegationList.length === 0;

    return (
      <div className="min-h-screen bg-[#efeeea] flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="flex flex-col items-center mb-8">
            <img src={munLogo} alt="MUN AI" className="h-16 object-contain mb-4" />
            <h1 className="font-display text-xl font-bold text-foreground">Delegate Registration</h1>
            <p className="text-sm text-muted-foreground mt-1">{conference?.name}</p>
          </div>
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div>
              <Label className="text-sm font-medium">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="rounded-xl mt-1.5" />
            </div>
            <div>
              <Label className="text-sm font-medium">Committee</Label>
              <Select value={committeeId} onValueChange={(v) => { setCommitteeId(v); setCountry(""); loadDelegationsForCommittee(v); }}>
                <SelectTrigger className="rounded-xl mt-1.5"><SelectValue placeholder="Select committee" /></SelectTrigger>
                <SelectContent>
                  {committees.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            {setupIncomplete ? (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs text-destructive">
                This committee isn't fully set up yet — the chair must publish the country matrix before delegates can join. Please check back later.
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-sm font-medium">Country / Delegation</Label>
                  {delegationList.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5 max-h-48 overflow-y-auto">
                      {delegationList.map((d: string) => {
                        const taken = takenDelegations.includes(d);
                        return (
                          <button key={d} disabled={taken} onClick={() => setCountry(d)}
                            className={`text-xs px-3 py-2 rounded-lg text-left transition-colors ${
                              taken ? "bg-secondary/30 text-muted-foreground/50 cursor-not-allowed line-through"
                                : country === d ? "bg-primary text-primary-foreground"
                                : "bg-secondary/50 text-foreground hover:bg-secondary"
                            }`}>{d}</button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1.5">Select a committee first to see available delegations.</p>
                  )}
                </div>
                <Button onClick={handleRegister} disabled={!committeeId || !country} className="w-full rounded-xl h-11 gradient-primary border-0 font-semibold">Register</Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  const selectedCommittee = committees.find((c: any) => c.id === delegate?.committee_id);
  const getDName = (id: string) => committeeDelegates.find((d) => d.id === id)?.country || "Unknown";

  const speaking = speakersEntries.find((e) => e.status === "speaking");
  const upcomingSpeakers = speakersEntries.filter((e) => e.status === "upcoming");
  const incomingPois = pois.filter((p) => p.to_delegate_id === delegate?.id && p.status === "approved");
  const sentPois = pois.filter((p) => p.from_delegate_id === delegate?.id);

  const tabItems: { key: DelegateTab; label: string; badge?: number }[] = [
    { key: "info", label: "Info" },
    { key: "pois", label: "POIs", badge: incomingPois.filter(p => !p.marked).length },
    { key: "speakers", label: "Speakers" },
    { key: "blocs", label: "Blocs" },
    { key: "updates", label: "Updates", badge: updates.length > 0 ? updates.length : undefined },
  ];

  return (
    <div className="min-h-screen bg-[#efeeea] p-4">
      <div className="max-w-2xl mx-auto pt-4 animate-fade-in space-y-4">
        <div className="flex items-center gap-3">
          <img src={munLogo} alt="MUN AI" className="h-10 object-contain" />
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">{delegate?.name}</h1>
            <p className="text-xs text-muted-foreground">{delegate?.country} · {selectedCommittee?.name}</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-accent ml-auto" />
        </div>

        {conferenceId && <LiveConferenceClock conferenceId={conferenceId} />}

        {/* Tab bar */}
        <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
          {tabItems.map(({ key, label, badge }) => (
            <button key={key} onClick={() => setTab(key)} className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors relative ${tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
              {label}
              {badge && badge > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center">{badge}</span>}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-accent" /> Committee Info
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedCommittee?.name}
                {selectedCommittee?.topic && <> — Topic: <strong>{selectedCommittee.topic}</strong></>}
              </p>
            </div>

            {/* GSL Speech */}
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" /> GSL Speech
              </h2>
              {docs.filter((d) => d.doc_type === "gsl_speech").length > 0 ? (
                <div className="bg-secondary/50 rounded-xl p-3">
                  <p className="text-xs text-accent font-medium">✓ GSL speech submitted</p>
                </div>
              ) : (
                <>
                  <Textarea value={gslText} onChange={(e) => setGslText(e.target.value)} placeholder="Type or paste your GSL speech..." className="rounded-xl min-h-[100px]" />
                  <p className="text-xs text-muted-foreground">AI integrity check: speeches with &gt;10% AI content will be rejected.</p>
                  <Button onClick={submitGSL} disabled={gslSubmitting || !gslText.trim()} className="w-full rounded-xl gradient-primary border-0 font-semibold">
                    {gslSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    Submit GSL Speech
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {tab === "pois" && (
          <div className="space-y-4">
            {/* Submit POI */}
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent" /> Submit Point of Information
              </h2>
              <Select value={poiTarget} onValueChange={setPoiTarget}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="To delegate or chair..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__chair__">📣 Chair (direct)</SelectItem>
                  {committeeDelegates.filter((d) => d.id !== delegate?.id).map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.country} — {d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea value={poiContent} onChange={(e) => setPoiContent(e.target.value)} placeholder="Your point of information..." className="rounded-xl min-h-[60px]" />
              <Button onClick={submitPOI} className="w-full rounded-xl gradient-primary border-0 font-semibold">Submit POI</Button>
            </div>

            {/* Incoming POIs */}
            {incomingPois.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <h2 className="font-display font-semibold text-foreground text-sm mb-3">Received POIs ({incomingPois.length})</h2>
                {incomingPois.map((p: any) => (
                  <div key={p.id} className="bg-secondary/50 rounded-xl px-4 py-3 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">From: <strong>{getDName(p.from_delegate_id)}</strong></p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.marked ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"}`}>
                        {p.marked ? "Marked" : "Unmarked"}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{p.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Sent POIs */}
            {sentPois.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <h2 className="font-display font-semibold text-foreground text-sm mb-3">Sent POIs ({sentPois.length})</h2>
                {sentPois.map((p: any) => (
                  <div key={p.id} className="bg-secondary/50 rounded-xl px-4 py-3 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">To: <strong>{getDName(p.to_delegate_id)}</strong></p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === "approved" ? "bg-accent/10 text-accent" : p.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"}`}>
                        {p.status || "pending"}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{p.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "speakers" && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
              <Mic className="w-4 h-4 text-accent" /> Speakers List
            </h2>
            {speaking && (
              <div className="bg-primary/10 rounded-2xl p-4 mb-3">
                <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-primary animate-pulse" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{getDName(speaking.delegate_id)}</p>
                    <p className="text-xs text-muted-foreground">Speaking now</p>
                  </div>
                </div>
              </div>
            )}
            {upcomingSpeakers.length > 0 ? (
              <div className="space-y-1">
                {upcomingSpeakers.map((e, i) => (
                  <div key={e.id} className={`bg-secondary/50 rounded-xl px-3 py-2 flex items-center gap-2 ${e.delegate_id === delegate?.id ? "ring-2 ring-primary" : ""}`}>
                    <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                    <span className="text-sm text-foreground">{getDName(e.delegate_id)}</span>
                    {e.delegate_id === delegate?.id && <span className="text-xs text-primary font-medium ml-auto">You</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming speakers.</p>
            )}
          </div>
        )}

        {tab === "blocs" && (
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-accent" /> Blocs
              </h2>
              {blocs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No blocs created yet.</p>
              ) : blocs.map((bloc) => {
                const isMember = myBlocs.some((m) => m.bloc_id === bloc.id || m.bloc_name === bloc.name);
                const isLeader = myBlocs.some((m) => (m.bloc_id === bloc.id || m.bloc_name === bloc.name) && m.is_leader);
                return (
                  <div key={bloc.id} className="bg-secondary/50 rounded-xl px-4 py-3 mb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground text-sm">{bloc.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          bloc.discussion_status === "done" ? "bg-accent/10 text-accent" :
                          bloc.discussion_status === "being_discussed" ? "bg-primary/10 text-primary" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          {bloc.discussion_status === "yet_to_discuss" ? "Yet to Discuss" : bloc.discussion_status === "being_discussed" ? "Being Discussed" : "Done"}
                        </span>
                      </div>
                      {!isMember ? (
                        <Button size="sm" onClick={() => joinBloc(bloc.id, bloc.name)} className="rounded-lg gradient-primary border-0 text-xs h-7">Join</Button>
                      ) : (
                        <span className="text-xs text-accent font-medium">{isLeader ? "Leader" : "Member"}</span>
                      )}
                    </div>
                    {bloc.file_url && isLeader && (
                      <a href={bloc.file_url} target="_blank" rel="noreferrer" className="text-xs text-accent underline mt-1 block">View directive</a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "updates" && updates.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 px-1">
              <Bell className="w-4 h-4 text-accent" /> Updates
            </h2>
            {updates.map((u: any) => (
              <div key={u.id} className="glass-card rounded-2xl p-4">
                <p className="text-xs text-accent font-medium mb-1">Update from: {u.author_name}</p>
                {u.title && <h3 className="font-display font-semibold text-foreground text-sm">{u.title}</h3>}
                <p className="text-sm text-foreground mt-1">{u.body}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(u.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DelegateRegister;
