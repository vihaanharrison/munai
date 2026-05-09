import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, BookOpen, FileText, Upload, Bell, CheckCircle2, MessageSquare, Mic, Shield, LogOut } from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";
import ConfirmDialog from "@/components/ConfirmDialog";

const DELEGATE_DEVICE_KEY = "munai_standalone_delegate";
function getDeviceId() {
  let id = localStorage.getItem(DELEGATE_DEVICE_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(DELEGATE_DEVICE_KEY, id); }
  return id;
}

type DelegateTab = "info" | "pois" | "speakers" | "blocs" | "updates";

const StandaloneDelegatePortal = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [committee, setCommittee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"register" | "pending" | "dashboard">("register");
  const [delegate, setDelegate] = useState<any>(null);
  const [takenDelegations, setTakenDelegations] = useState<string[]>([]);
  const [tab, setTab] = useState<DelegateTab>("info");

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [gslText, setGslText] = useState("");
  const [gslSubmitting, setGslSubmitting] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [poiContent, setPoiContent] = useState("");
  const [poiTarget, setPoiTarget] = useState("");
  const [pois, setPois] = useState<any[]>([]);
  const [committeeDelegates, setCommitteeDelegates] = useState<any[]>([]);
  const [speakersEntries, setSpeakersEntries] = useState<any[]>([]);
  const [blocs, setBlocs] = useState<any[]>([]);
  const [myBlocs, setMyBlocs] = useState<any[]>([]);

  useEffect(() => { loadData(); }, [id]);

  useEffect(() => {
    if (!delegate) return;
    const channel = supabase.channel("standalone-del-approval")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "delegates", filter: `id=eq.${delegate.id}` }, (payload) => {
        const updated = payload.new as any;
        setDelegate(updated);
        if (updated.approved && step === "pending") { setStep("dashboard"); toast.success("Approved!"); loadDashboardData(updated); }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [delegate?.id, step]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase.channel("standalone-del-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "pois", filter: `committee_id=eq.${id}` }, () => loadPois())
      .on("postgres_changes", { event: "*", schema: "public", table: "speakers_list", filter: `committee_id=eq.${id}` }, () => loadSpeakers())
      .on("postgres_changes", { event: "*", schema: "public", table: "delegates", filter: `committee_id=eq.${id}` }, () => {
        loadCommitteeDelegates();
        supabase.from("delegates").select("country").eq("committee_id", id).eq("active", true).then(({ data }: any) => {
          setTakenDelegations((data || []).map((d: any) => d.country));
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    const { data: sc } = await supabase.from("standalone_committees" as any).select("*").eq("id", id).single() as any;
    setCommittee(sc);

    const deviceId = getDeviceId();
    const { data: existing } = await supabase.from("delegates").select("*").eq("device_id", deviceId).eq("committee_id", id).eq("active", true).maybeSingle() as any;
    if (existing) {
      setDelegate(existing);
      if (existing.approved) { setStep("dashboard"); await loadDashboardData(existing); }
      else setStep("pending");
    }
    // Load taken delegations
    const { data: taken } = await supabase.from("delegates").select("country").eq("committee_id", id).eq("active", true) as any;
    setTakenDelegations((taken || []).map((d: any) => d.country));
    setLoading(false);
  };

  const loadDashboardData = async (del?: any) => {
    const d = del || delegate;
    if (!d) return;
    await Promise.all([loadDocs(d.id), loadUpdates(), loadCommitteeDelegates(), loadPois(d), loadSpeakers(d), loadBlocsData(d)]);
  };

  const loadDocs = async (dId?: string) => { const { data } = await supabase.from("delegate_documents").select("*").eq("delegate_id", dId || delegate?.id) as any; setDocs(data || []); };
  const loadUpdates = async () => { const { data } = await supabase.from("conference_updates").select("*").eq("committee_id", id!).order("created_at", { ascending: false }) as any; setUpdates(data || []); };
  const loadCommitteeDelegates = async () => { const { data } = await supabase.from("delegates").select("*").eq("committee_id", id!).eq("approved", true).eq("active", true) as any; setCommitteeDelegates(data || []); };
  const loadPois = async (del?: any) => { const d = del || delegate; if (!d) return; const { data } = await supabase.from("pois").select("*").or(`from_delegate_id.eq.${d.id},to_delegate_id.eq.${d.id}`).order("created_at", { ascending: false }) as any; setPois(data || []); };
  const loadSpeakers = async (del?: any) => { const d = del || delegate; if (!d) return; const { data } = await supabase.from("speakers_list").select("*").eq("committee_id", d.committee_id).order("position") as any; setSpeakersEntries(data || []); };
  const loadBlocsData = async (del?: any) => { const d = del || delegate; if (!d) return; const [b, m] = await Promise.all([supabase.from("blocs").select("*").eq("committee_id", d.committee_id) as any, supabase.from("delegate_blocs").select("*").eq("delegate_id", d.id) as any]); setBlocs(b.data || []); setMyBlocs(m.data || []); };

  const handleRegister = async () => {
    if (!name.trim() || !country.trim()) { toast.error("Fill in all fields"); return; }
    const deviceId = getDeviceId();
    const { data, error } = await supabase.from("delegates").insert({
      conference_id: id!, committee_id: id!,
      name: name.trim(), country: country.trim(),
      device_id: deviceId, active: true, approved: false,
    } as any).select().single();
    if (error) { toast.error(error.message); return; }
    setDelegate(data);
    setStep("pending");
    toast.success("Registration submitted!");
  };

  const submitGSL = async () => {
    if (!gslText.trim() || !delegate) return;
    setGslSubmitting(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ type: "ai-check", content: gslText }),
      });
      const result = await resp.json();
      if (result.ai_percentage > 10 || result.is_acceptable === false) { toast.error(`Rejected: ${result.ai_percentage}% AI content`); return; }
      await supabase.from("delegate_documents").insert({ delegate_id: delegate.id, committee_id: id!, conference_id: id!, doc_type: "gsl_speech", content: gslText.trim(), status: "pending", ai_check_result: result } as any);
      setGslText(""); loadDocs(); toast.success("GSL speech submitted!");
    } catch { toast.error("Failed"); } finally { setGslSubmitting(false); }
  };

  const submitPOI = async () => {
    if (!poiContent.trim() || !poiTarget || !delegate) { toast.error("Select delegate and write POI"); return; }
    await supabase.from("pois").insert({ committee_id: id!, conference_id: id!, from_delegate_id: delegate.id, to_delegate_id: poiTarget, content: poiContent.trim(), status: "pending" } as any);
    setPoiContent(""); setPoiTarget(""); loadPois(); toast.success("POI submitted");
  };

  const joinBloc = async (blocId: string, blocName: string) => {
    if (!delegate) return;
    if (myBlocs.find((m) => m.bloc_id === blocId)) { toast.info("Already in this bloc"); return; }
    await supabase.from("delegate_blocs").insert({ delegate_id: delegate.id, committee_id: id!, conference_id: id!, bloc_name: blocName, bloc_id: blocId } as any);
    loadBlocsData(); toast.success(`Joined ${blocName}`);
  };

  const handleExit = async () => {
    if (delegate) await supabase.from("delegates").update({ active: false } as any).eq("id", delegate.id);
    navigate("/");
  };

  if (loading) return <div className="min-h-screen bg-[#efeeea] flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!committee) return <div className="min-h-screen bg-[#efeeea] flex items-center justify-center"><p className="text-muted-foreground">Committee not found</p></div>;

  if (step === "pending") {
    return (
      <div className="min-h-screen bg-[#efeeea] flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 text-center max-w-sm animate-fade-in">
          <img src={munLogo} alt="MUN AI" className="h-16 mx-auto mb-4" />
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <h2 className="font-display font-bold text-foreground text-lg mb-2">Pending Approval</h2>
          <p className="text-sm text-muted-foreground">Waiting for chair to approve <strong>{delegate?.name}</strong> ({delegate?.country})</p>
        </div>
      </div>
    );
  }

  if (step === "register") {
    const delegationList = committee.delegations ? committee.delegations.split(",").map((d: string) => d.trim()).filter(Boolean) : [];
    return (
      <div className="min-h-screen bg-[#efeeea] flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="flex flex-col items-center mb-8">
            <img src={munLogo} alt="MUN AI" className="h-20 object-contain mb-4" />
            <h1 className="font-display text-xl font-bold text-foreground">Join {committee.name}</h1>
          </div>
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div><Label className="text-sm font-medium">Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="rounded-xl mt-1.5" /></div>
            {delegationList.length === 0 ? (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs text-destructive">
                Committee not yet open — the chair must publish the delegation matrix first. Check back shortly.
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-sm font-medium">Delegation</Label>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5 max-h-48 overflow-y-auto">
                    {delegationList.map((d: string) => {
                      const taken = takenDelegations.includes(d);
                      return <button key={d} disabled={taken} onClick={() => setCountry(d)} className={`text-xs px-3 py-2 rounded-lg text-left transition-colors ${taken ? "bg-secondary/30 text-muted-foreground/50 cursor-not-allowed line-through" : country === d ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground hover:bg-secondary"}`}>{d}</button>;
                    })}
                  </div>
                </div>
                <Button onClick={handleRegister} disabled={!name.trim() || !country} className="w-full rounded-xl h-11 gradient-primary border-0 font-semibold">Register</Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  const getDName = (did: string) => committeeDelegates.find((d) => d.id === did)?.country || "Unknown";
  const speaking = speakersEntries.find((e) => e.status === "speaking");
  const upcomingSpeakers = speakersEntries.filter((e) => e.status === "upcoming");
  const incomingPois = pois.filter((p) => p.to_delegate_id === delegate?.id && p.status === "approved");
  const sentPois = pois.filter((p) => p.from_delegate_id === delegate?.id);

  const tabItems: { key: DelegateTab; label: string; badge?: number }[] = [
    { key: "info", label: "Info" },
    { key: "pois", label: "POIs", badge: incomingPois.filter(p => !p.marked).length },
    { key: "speakers", label: "Speakers" },
    { key: "blocs", label: "Blocs" },
    { key: "updates", label: "Updates" },
  ];

  return (
    <div className="min-h-screen bg-[#efeeea] p-4">
      <div className="max-w-2xl mx-auto pt-4 animate-fade-in space-y-4">
        <div className="flex items-center gap-3">
          <img src={munLogo} alt="MUN AI" className="h-10 object-contain" />
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold text-foreground">{delegate?.name}</h1>
            <p className="text-xs text-muted-foreground">{delegate?.country} · {committee.name}</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-accent" />
          <ConfirmDialog
            trigger={<Button variant="ghost" size="icon" className="rounded-xl" title="Exit"><LogOut className="w-4 h-4" /></Button>}
            title="Exit Committee"
            description="Are you sure you want to leave this committee? You will need to re-register."
            onConfirm={handleExit}
            confirmLabel="Exit"
            variant="destructive"
          />
        </div>

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
              <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-2"><BookOpen className="w-4 h-4 text-accent" /> Committee Info</h2>
              <p className="text-sm text-muted-foreground">{committee.name}{committee.topic && <> — Topic: <strong>{committee.topic}</strong></>}</p>
            </div>
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-accent" /> GSL Speech</h2>
              {docs.filter((d) => d.doc_type === "gsl_speech").length > 0 ? (
                <div className="bg-secondary/50 rounded-xl p-3"><p className="text-xs text-accent font-medium">✓ GSL submitted</p></div>
              ) : (
                <>
                  <Textarea value={gslText} onChange={(e) => setGslText(e.target.value)} placeholder="Type your GSL speech..." className="rounded-xl min-h-[100px]" />
                  <Button onClick={submitGSL} disabled={gslSubmitting || !gslText.trim()} className="w-full rounded-xl gradient-primary border-0 font-semibold">
                    {gslSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />} Submit
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {tab === "pois" && (
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4 text-accent" /> Submit POI</h2>
              <Select value={poiTarget} onValueChange={setPoiTarget}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="To delegate..." /></SelectTrigger>
                <SelectContent>{committeeDelegates.filter((d) => d.id !== delegate?.id).map((d) => <SelectItem key={d.id} value={d.id}>{d.country} — {d.name}</SelectItem>)}</SelectContent>
              </Select>
              <Textarea value={poiContent} onChange={(e) => setPoiContent(e.target.value)} placeholder="Your POI..." className="rounded-xl min-h-[60px]" />
              <Button onClick={submitPOI} className="w-full rounded-xl gradient-primary border-0 font-semibold">Submit POI</Button>
            </div>
            {incomingPois.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <h2 className="font-display font-semibold text-foreground text-sm mb-3">Received ({incomingPois.length})</h2>
                {incomingPois.map((p: any) => (
                  <div key={p.id} className="bg-secondary/50 rounded-xl px-4 py-3 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">From: <strong>{getDName(p.from_delegate_id)}</strong></p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.marked ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"}`}>{p.marked ? "Marked" : "Unmarked"}</span>
                    </div>
                    <p className="text-sm text-foreground">{p.content}</p>
                  </div>
                ))}
              </div>
            )}
            {sentPois.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <h2 className="font-display font-semibold text-foreground text-sm mb-3">Sent ({sentPois.length})</h2>
                {sentPois.map((p: any) => (
                  <div key={p.id} className="bg-secondary/50 rounded-xl px-4 py-3 mb-2">
                    <p className="text-xs text-muted-foreground mb-1">To: <strong>{getDName(p.to_delegate_id)}</strong></p>
                    <p className="text-sm text-foreground">{p.content}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === "approved" ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"}`}>{p.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "speakers" && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3"><Mic className="w-4 h-4 text-accent" /> Speakers List</h2>
            {speaking && (
              <div className="bg-primary/10 rounded-2xl p-4 mb-3">
                <div className="flex items-center gap-2"><Mic className="w-5 h-5 text-primary animate-pulse" /><div><p className="font-semibold text-foreground text-sm">{getDName(speaking.delegate_id)}</p><p className="text-xs text-muted-foreground">Speaking now</p></div></div>
              </div>
            )}
            {upcomingSpeakers.length > 0 ? upcomingSpeakers.map((e, i) => (
              <div key={e.id} className={`bg-secondary/50 rounded-xl px-3 py-2 mb-1 flex items-center gap-2 ${e.delegate_id === delegate?.id ? "ring-2 ring-primary" : ""}`}>
                <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                <span className="text-sm text-foreground">{getDName(e.delegate_id)}</span>
                {e.delegate_id === delegate?.id && <span className="text-xs text-primary font-medium ml-auto">You</span>}
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">No upcoming speakers.</p>}
          </div>
        )}

        {tab === "blocs" && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3"><Shield className="w-4 h-4 text-accent" /> Blocs</h2>
            {blocs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No blocs yet.</p> : blocs.map((bloc) => {
              const isMember = myBlocs.some((m) => m.bloc_id === bloc.id);
              return (
                <div key={bloc.id} className="bg-secondary/50 rounded-xl px-4 py-3 mb-2 flex items-center justify-between">
                  <div><p className="font-medium text-foreground text-sm">{bloc.name}</p><span className={`text-[10px] px-2 py-0.5 rounded-full ${bloc.discussion_status === "done" ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"}`}>{bloc.discussion_status === "yet_to_discuss" ? "Yet to Discuss" : bloc.discussion_status === "being_discussed" ? "Being Discussed" : "Done"}</span></div>
                  {!isMember ? <Button size="sm" onClick={() => joinBloc(bloc.id, bloc.name)} className="rounded-lg gradient-primary border-0 text-xs h-7">Join</Button> : <span className="text-xs text-accent font-medium">Member</span>}
                </div>
              );
            })}
          </div>
        )}

        {tab === "updates" && updates.length > 0 && (
          <div className="space-y-2">
            {updates.map((u: any) => (
              <div key={u.id} className="glass-card rounded-2xl p-4">
                <p className="text-xs text-accent font-medium mb-1">Update from: {u.author_name}</p>
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

export default StandaloneDelegatePortal;
