import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2, Users, LogOut, User, Check, X, Plus, FileText,
  Bell, BookOpen, AlertTriangle, Eye, MessageSquare, BarChart3, Mic, Shield, Info, ArrowLeft
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import munLogo from "@/assets/mun-ai-logo.png";
import AIAssistant from "@/components/AIAssistant";
import ChairPOIPanel from "@/components/chair/ChairPOIPanel";
import ChairScoringSheet from "@/components/chair/ChairScoringSheet";
import SpeakersList from "@/components/chair/SpeakersList";
import BlocsManager from "@/components/chair/BlocsManager";
import CrisisPanel from "@/components/chair/CrisisPanel";
import PlannedNotes from "@/components/PlannedNotes";
import LiveTimers from "@/components/LiveTimers";
import ConfirmDialog from "@/components/ConfirmDialog";
import CustomTabsManager from "@/components/chair/CustomTabsManager";
import { Download } from "lucide-react";

const DEVICE_KEY = "munai_standalone_chair";
function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, id); }
  return id;
}

type Tab = "delegates" | "speakers" | "scoring" | "pois" | "agendas" | "blocs" | "updates" | "crisis" | "files" | "ai" | "notes" | "custom";

const StandaloneChairPortal = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<"login" | "dashboard">("login");
  const [displayName, setDisplayName] = useState("");
  const [committee, setCommittee] = useState<any>(null);
  const [delegates, setDelegates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("delegates");
  const [pendingCount, setPendingCount] = useState(0);

  const [agendas, setAgendas] = useState<any[]>([]);
  const [newAgenda, setNewAgenda] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const [updates, setUpdates] = useState<any[]>([]);
  const [selectedDelegate, setSelectedDelegate] = useState<any>(null);
  const [delegateDocs, setDelegateDocs] = useState<any[]>([]);
  const [delegatePois, setDelegatePois] = useState<any[]>([]);
  const [delegateBlocs, setDelegateBlocs] = useState<any[]>([]);

  useEffect(() => { loadInitial(); }, [id]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel("standalone-chair-delegates")
      .on("postgres_changes", { event: "*", schema: "public", table: "delegates", filter: `committee_id=eq.${id}` }, () => loadDelegates())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const loadInitial = async () => {
    if (!id) return;
    const { data: sc } = await supabase.from("standalone_committees" as any).select("*").eq("id", id).single() as any;
    if (!sc) { setLoading(false); return; }
    setCommittee(sc);

    const deviceId = getDeviceId();
    const { data: existingSession } = await supabase
      .from("chair_sessions").select("*")
      .eq("device_id", deviceId).eq("committee_id", id).eq("active", true)
      .maybeSingle() as any;

    if (existingSession) {
      setSessionId(existingSession.id);
      setDisplayName(existingSession.display_name || "");
      setStep("dashboard");
      await Promise.all([loadDelegates(), loadAgendas(), loadUpdates()]);
    }
    setLoading(false);
  };

  const loadDelegates = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from("delegates").select("*").eq("committee_id", id).order("created_at", { ascending: true }) as any;
    const list = data || [];
    setDelegates(list);
    setPendingCount(list.filter((d: any) => !d.approved && d.active).length);
  }, [id]);

  const loadAgendas = async () => {
    if (!id) return;
    const { data } = await supabase.from("committee_agendas").select("*").eq("committee_id", id).order("sort_order") as any;
    setAgendas(data || []);
  };

  const loadUpdates = async () => {
    if (!id) return;
    const { data } = await supabase.from("conference_updates").select("*").eq("committee_id", id).order("created_at", { ascending: false }) as any;
    setUpdates(data || []);
  };

  const handleLogin = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) { toast.error("Please enter your name"); return; }
    if (trimmedName.length > 80) { toast.error("Name is too long (max 80 characters)"); return; }
    if (!id) { toast.error("Committee not loaded yet"); return; }
    if (!committee) { toast.error("Committee not found"); return; }

    const { count } = await supabase
      .from("chair_sessions")
      .select("id", { count: "exact", head: true })
      .eq("committee_id", id)
      .eq("active", true) as any;
    if ((count ?? 0) >= 3) { toast.error("Maximum 3 chairs per committee reached"); return; }

    const deviceId = getDeviceId();
    // Standalone committees don't have a parent conference — reuse the committee id as conference_id sentinel
    const { data, error } = await supabase.from("chair_sessions").insert({
      device_id: deviceId,
      conference_id: id,
      committee_id: id,
      display_name: trimmedName,
      active: true,
      approved: true,
      source: "standalone",
    } as any).select().single();

    // Best-effort: claim ownership for the creator if logged in and not yet set
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user && committee && !committee.created_by_user_id) {
        await supabase.from("standalone_committees" as any)
          .update({ created_by_user_id: auth.user.id } as any)
          .eq("id", id).is("created_by_user_id", null);
      }
    } catch {}

    if (error) { toast.error(`Could not start chair session: ${error.message}`); return; }
    setSessionId((data as any).id);
    setStep("dashboard");
    await Promise.all([loadDelegates(), loadAgendas(), loadUpdates()]);
    toast.success("Logged in as Chair");
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    await supabase.from("chair_sessions").update({ active: false } as any).eq("id", sessionId);
    toast.success("Session ended");
    navigate("/");
  };

  const approveDelegate = async (delegateId: string) => {
    await supabase.from("delegates").update({ approved: true } as any).eq("id", delegateId);
    loadDelegates();
    toast.success("Delegate approved");
  };

  const denyDelegate = async (delegateId: string) => {
    await supabase.from("delegates").update({ active: false } as any).eq("id", delegateId);
    loadDelegates();
    toast.success("Delegate denied");
  };

  const addAgenda = async () => {
    if (!newAgenda.trim() || !id) return;
    await supabase.from("committee_agendas").insert({
      committee_id: id, conference_id: id,
      name: newAgenda.trim(), sort_order: agendas.length,
    } as any);
    setNewAgenda("");
    loadAgendas();
    toast.success("Agenda added");
  };

  const pushUpdate = async () => {
    if (!updateBody.trim() || !id) return;
    await supabase.from("conference_updates").insert({
      conference_id: id, committee_id: id,
      author_name: displayName, author_role: "chair",
      body: updateBody.trim(),
    } as any);
    setUpdateBody("");
    loadUpdates();
    toast.success("Update pushed");
  };

  const viewDelegateProfile = async (delegate: any) => {
    setSelectedDelegate(delegate);
    const [docsRes, poisRes, blocsRes] = await Promise.all([
      supabase.from("delegate_documents").select("*").eq("delegate_id", delegate.id) as any,
      supabase.from("pois").select("*").or(`from_delegate_id.eq.${delegate.id},to_delegate_id.eq.${delegate.id}`) as any,
      supabase.from("delegate_blocs").select("*").eq("delegate_id", delegate.id) as any,
    ]);
    setDelegateDocs(docsRes.data || []);
    setDelegatePois(poisRes.data || []);
    setDelegateBlocs(blocsRes.data || []);
  };

  if (loading) return <div className="min-h-screen bg-[#efeeea] flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  if (!committee) return <div className="min-h-screen bg-[#efeeea] flex items-center justify-center"><p className="text-muted-foreground">Committee not found</p></div>;

  if (step === "login") {
    return (
      <div className="min-h-screen bg-[#efeeea] flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="flex flex-col items-center mb-8">
            <img src={munLogo} alt="MUN AI" className="h-20 object-contain mb-4" />
            <h1 className="font-display text-xl font-bold text-foreground">Chair Login</h1>
            <p className="text-sm text-muted-foreground mt-1">{committee.name}</p>
          </div>
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div>
              <Label className="text-sm font-medium">Your Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Enter your full name" className="rounded-xl mt-1.5" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
            </div>
            <Button onClick={handleLogin} className="w-full rounded-xl h-11 gradient-primary border-0 font-semibold">Enter as Chair</Button>
          </div>
        </div>
      </div>
    );
  }

  const pendingDelegates = delegates.filter((d) => !d.approved && d.active);
  const approvedDelegates = delegates.filter((d) => d.approved);

  const isCrisisCommittee = committee?.committee_type === "crisis";
  const isCrisis = isCrisisCommittee || !!committee?.crisis_enabled || !!committee?.crisis_mode_active;
  const tabItems: { key: Tab; label: string; badge?: number }[] = [
    { key: "delegates", label: "Delegates", badge: pendingCount },
    { key: "speakers", label: "Speakers" },
    { key: "scoring", label: "Scores" },
    { key: "pois", label: "POIs" },
    { key: "blocs", label: "Blocs" },
    { key: "agendas", label: "Agendas" },
    { key: "updates", label: "Updates" },
    ...(isCrisis ? [{ key: "crisis" as Tab, label: "Crisis" }] : []),
    { key: "files", label: "Files" },
    { key: "custom", label: "Custom" },
    { key: "ai", label: "AI" },
  ];

  const downloadArchive = async () => {
    if (!id) return;
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-conference-archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ standaloneCommitteeId: id }),
      });
      if (!resp.ok) throw new Error("Export failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${committee?.name || "committee"}-archive.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Archive downloaded");
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleCrisisMode = async () => {
    if (!committee || !id) return;
    const next = !committee.crisis_mode_active;
    await supabase.from("standalone_committees" as any).update({ crisis_mode_active: next } as any).eq("id", id);
    setCommittee({ ...committee, crisis_mode_active: next });
    toast.success(next ? "Crisis mode enabled" : "Crisis mode disabled");
  };

  return (
    <div className="min-h-screen bg-[#efeeea] flex flex-col">
      <div className="p-4 pb-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
              </TooltipTrigger>
              <TooltipContent>Back</TooltipContent>
            </Tooltip>
            <img src={munLogo} alt="MUN AI" className="h-10 object-contain" />
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">{committee.name}</h1>
              <p className="text-xs text-muted-foreground">Chair: {displayName} · Standalone</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isCrisisCommittee && (
              <Button variant={committee.crisis_mode_active ? "destructive" : "ghost"} size="sm" onClick={toggleCrisisMode} className="rounded-xl text-xs" title={committee.crisis_mode_active ? "Disable crisis mode" : "Enable crisis mode"}>
                <AlertTriangle className="w-4 h-4 mr-1" /> {committee.crisis_mode_active ? "Crisis On" : "Crisis"}
              </Button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={downloadArchive} className="rounded-xl"><Download className="w-4 h-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>Download archive (.zip)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => navigate("/hmun-rop")} className="rounded-xl"><BookOpen className="w-4 h-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>HMUN ROP</TooltipContent>
            </Tooltip>
            <ConfirmDialog
              trigger={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl"><LogOut className="w-5 h-5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Exit (committee preserved)</TooltipContent>
                </Tooltip>
              }
              title="Exit Session"
              description="You'll be returned to the homepage. The committee remains active and you can re-enter anytime with your code."
              onConfirm={handleEndSession}
              confirmLabel="Exit"
              variant="destructive"
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 mt-3">
        <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 overflow-x-auto">
          {tabItems.map(({ key, label, badge }) => (
            <button key={key} onClick={() => setTab(key)} className={`flex-shrink-0 text-xs font-medium py-2 px-3 rounded-lg transition-colors relative ${tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
              {label}
              {badge && badge > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center">{badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full p-4 animate-fade-in">
        {selectedDelegate && (
          <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedDelegate(null)}>
            <div className="glass-card rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-foreground">{selectedDelegate.name}</h2>
                <button onClick={() => setSelectedDelegate(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{selectedDelegate.country}</p>
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Marks</h3>
                {Object.entries(selectedDelegate.marks || {}).length > 0 ? (
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(selectedDelegate.marks || {}).map(([key, val]) => (
                      <div key={key} className="bg-secondary/50 rounded-lg px-3 py-1.5 flex justify-between">
                        <span className="text-xs text-muted-foreground">{key}</span>
                        <span className="text-xs font-semibold text-foreground">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">No marks yet</p>}
              </div>
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Documents ({delegateDocs.length})</h3>
                {delegateDocs.map((doc: any) => (
                  <div key={doc.id} className="bg-secondary/50 rounded-lg px-3 py-2 mb-1">
                    <span className="text-xs font-medium text-foreground">{doc.doc_type === "position_paper" ? "Position Paper" : "GSL Speech"}</span>
                    <span className={`ml-2 text-xs ${doc.status === "approved" ? "text-accent" : "text-muted-foreground"}`}>{doc.status}</span>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">POIs ({delegatePois.length})</h3>
                {delegatePois.slice(0, 5).map((poi: any) => (
                  <div key={poi.id} className="bg-secondary/50 rounded-lg px-3 py-2 mb-1 text-xs text-foreground">{poi.content}</div>
                ))}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Blocs</h3>
                {delegateBlocs.length === 0 ? <p className="text-xs text-muted-foreground">Not in any bloc</p> : delegateBlocs.map((b: any) => (
                  <span key={b.id} className="inline-block bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full mr-1">{b.bloc_name}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "delegates" && (
          <div className="space-y-4">
            {pendingDelegates.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3"><Bell className="w-4 h-4 text-destructive" /> Pending ({pendingDelegates.length})</h2>
                {pendingDelegates.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3 mb-2">
                    <div><p className="font-medium text-foreground text-sm">{d.name}</p><p className="text-xs text-muted-foreground">{d.country}</p></div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveDelegate(d.id)} className="rounded-lg gradient-primary border-0 text-xs h-7 px-3"><Check className="w-3 h-3 mr-1" /> Approve</Button>
                      <Button size="sm" variant="ghost" onClick={() => denyDelegate(d.id)} className="rounded-lg text-xs h-7 px-3"><X className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-accent" /> Approved ({approvedDelegates.length})</h2>
              {approvedDelegates.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No delegates yet.</p> : (
                <div className="space-y-2">
                  {approvedDelegates.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3 cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => viewDelegateProfile(d)}>
                      <div className="flex items-center gap-3"><User className="w-4 h-4 text-muted-foreground" /><div><p className="font-medium text-foreground text-sm">{d.name}</p><p className="text-xs text-muted-foreground">{d.country}</p></div></div>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "speakers" && id && <SpeakersList committeeId={id} conferenceId={id} delegates={delegates} onDelegatesUpdated={loadDelegates} />}
        {tab === "scoring" && id && <ChairScoringSheet committeeId={id} conferenceId={id} delegates={delegates} committee={committee} onDelegatesUpdated={loadDelegates} />}
        {tab === "pois" && id && <ChairPOIPanel committeeId={id} conferenceId={id} delegates={delegates} />}
        {tab === "blocs" && id && <BlocsManager committeeId={id} conferenceId={id} delegates={delegates} />}

        {tab === "agendas" && (
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-accent" /> Agendas</h2>
            {agendas.map((a: any) => (
              <div key={a.id} className="bg-secondary/50 rounded-xl px-4 py-3">
                <p className="font-medium text-foreground text-sm">{a.name}</p>
                {a.ai_summary && <p className="text-xs text-accent mt-1">AI: {a.ai_summary}</p>}
              </div>
            ))}
            <div className="flex gap-2">
              <Input value={newAgenda} onChange={(e) => setNewAgenda(e.target.value)} placeholder="Agenda topic..." className="rounded-xl flex-1" onKeyDown={(e) => e.key === "Enter" && addAgenda()} />
              <Button onClick={addAgenda} className="rounded-xl gradient-primary border-0"><Plus className="w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {tab === "updates" && (
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2"><Bell className="w-4 h-4 text-accent" /> Push Update</h2>
              <Textarea value={updateBody} onChange={(e) => setUpdateBody(e.target.value)} placeholder="Write an update..." className="rounded-xl min-h-[60px]" />
              <Button onClick={pushUpdate} className="w-full rounded-xl gradient-primary border-0 font-semibold">Publish</Button>
            </div>
            {updates.map((u: any) => (
              <div key={u.id} className="glass-card rounded-2xl p-4">
                <p className="text-xs text-accent font-medium mb-1">Update from: {u.author_name}</p>
                <p className="text-sm text-foreground mt-1">{u.body}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(u.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "crisis" && id && <CrisisPanel committeeId={id} conferenceId={id} committee={committee} />}

        {tab === "files" && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-accent" /> Committee Files</h2>
            <p className="text-sm text-muted-foreground text-center py-4">File upload coming soon.</p>
          </div>
        )}

        {tab === "custom" && id && <CustomTabsManager committeeId={id} committee={committee} isStandalone authorName={displayName} />}
        {tab === "ai" && <AIAssistant />}
      </div>

      <PlannedNotes ownerType="chair" ownerId={getDeviceId()} committeeId={id} />
    </div>
  );
};

export default StandaloneChairPortal;
