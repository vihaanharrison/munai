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
  Bell, BookOpen, AlertTriangle, Eye, MessageSquare, BarChart3, Mic, Shield
} from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";
import LiveConferenceClock from "@/components/LiveConferenceClock";
import AIAssistant from "@/components/AIAssistant";
import ChairPOIPanel from "@/components/chair/ChairPOIPanel";
import ChairScoringSheet from "@/components/chair/ChairScoringSheet";
import SpeakersList from "@/components/chair/SpeakersList";
import BlocsManager from "@/components/chair/BlocsManager";
import CrisisPanel from "@/components/chair/CrisisPanel";

const DEVICE_KEY = "munai_chair_device";
function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, id); }
  return id;
}

type Tab = "delegates" | "speakers" | "scoring" | "pois" | "agendas" | "blocs" | "updates" | "crisis" | "files" | "ai";

const ChairPortal = () => {
  const { conferenceId, committeeId } = useParams<{ conferenceId: string; committeeId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<"login" | "dashboard">("login");
  const [displayName, setDisplayName] = useState("");
  const [committee, setCommittee] = useState<any>(null);
  const [conference, setConference] = useState<any>(null);
  const [delegates, setDelegates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("delegates");
  const [pendingCount, setPendingCount] = useState(0);

  // Agendas
  const [agendas, setAgendas] = useState<any[]>([]);
  const [newAgenda, setNewAgenda] = useState("");

  // Updates
  const [updateBody, setUpdateBody] = useState("");
  const [updates, setUpdates] = useState<any[]>([]);

  // Delegate profile view
  const [selectedDelegate, setSelectedDelegate] = useState<any>(null);
  const [delegateDocs, setDelegateDocs] = useState<any[]>([]);
  const [delegatePois, setDelegatePois] = useState<any[]>([]);
  const [delegateBlocs, setDelegateBlocs] = useState<any[]>([]);

  useEffect(() => { loadInitial(); }, [conferenceId, committeeId]);

  useEffect(() => {
    if (!committeeId) return;
    const channel = supabase
      .channel("chair-delegates")
      .on("postgres_changes", { event: "*", schema: "public", table: "delegates", filter: `committee_id=eq.${committeeId}` }, () => loadDelegates())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [committeeId]);

  const loadInitial = async () => {
    if (!conferenceId || !committeeId) return;
    const [comRes, confRes] = await Promise.all([
      supabase.from("committees").select("*").eq("id", committeeId).single(),
      supabase.from("conferences").select("*").eq("id", conferenceId).single(),
    ]);
    setCommittee(comRes.data);
    setConference(confRes.data);

    const deviceId = getDeviceId();
    const { data: existingSession } = await supabase
      .from("chair_sessions").select("*")
      .eq("device_id", deviceId).eq("committee_id", committeeId).eq("active", true)
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
    if (!committeeId) return;
    const { data } = await supabase.from("delegates").select("*").eq("committee_id", committeeId).order("created_at", { ascending: true }) as any;
    const list = data || [];
    setDelegates(list);
    setPendingCount(list.filter((d: any) => !d.approved && d.active).length);
  }, [committeeId]);

  const loadAgendas = async () => {
    if (!committeeId) return;
    const { data } = await supabase.from("committee_agendas").select("*").eq("committee_id", committeeId).order("sort_order") as any;
    setAgendas(data || []);
  };

  const loadUpdates = async () => {
    if (!conferenceId || !committeeId) return;
    const { data } = await supabase.from("conference_updates").select("*")
      .eq("conference_id", conferenceId)
      .or(`committee_id.eq.${committeeId},committee_id.is.null`)
      .order("created_at", { ascending: false }) as any;
    setUpdates(data || []);
  };

  const handleLogin = async () => {
    if (!displayName.trim()) { toast.error("Please enter your name"); return; }
    const { data: existing } = await supabase.from("chair_sessions").select("id").eq("committee_id", committeeId!).eq("active", true) as any;
    if (existing && existing.length >= 3) { toast.error("Maximum 3 chairs per committee reached"); return; }

    const deviceId = getDeviceId();
    const { data, error } = await supabase.from("chair_sessions").insert({
      device_id: deviceId, conference_id: conferenceId!, committee_id: committeeId!,
      display_name: displayName.trim(), active: true,
    } as any).select().single();

    if (error) { toast.error(error.message); return; }
    setSessionId((data as any).id);
    setStep("dashboard");
    await Promise.all([loadDelegates(), loadAgendas(), loadUpdates()]);
    toast.success("Logged in as Chair");
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    await supabase.from("chair_sessions").update({ active: false } as any).eq("id", sessionId);
    localStorage.removeItem(DEVICE_KEY);
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
    if (!newAgenda.trim() || !committeeId || !conferenceId) return;
    await supabase.from("committee_agendas").insert({
      committee_id: committeeId, conference_id: conferenceId,
      name: newAgenda.trim(), sort_order: agendas.length,
    } as any);
    setNewAgenda("");
    loadAgendas();
    toast.success("Agenda added");
  };

  const pushChairUpdate = async () => {
    if (!updateBody.trim() || !conferenceId || !committeeId) return;
    await supabase.from("conference_updates").insert({
      conference_id: conferenceId, committee_id: committeeId,
      author_name: displayName, author_role: "chair",
      body: updateBody.trim(),
    } as any);
    setUpdateBody("");
    loadUpdates();
    toast.success("Update pushed to your committee");
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

  if (loading) {
    return <div className="min-h-screen bg-[#efeeea] flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  if (step === "login") {
    return (
      <div className="min-h-screen bg-[#efeeea] flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="flex flex-col items-center mb-8">
            <img src={munLogo} alt="MUN AI" className="h-16 object-contain mb-4" />
            <h1 className="font-display text-xl font-bold text-foreground">Chair Login</h1>
            <p className="text-sm text-muted-foreground mt-1">{committee?.name}</p>
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

  const tabItems: { key: Tab; label: string; icon: any; badge?: number }[] = [
    { key: "delegates", label: "Delegates", icon: Users, badge: pendingCount },
    { key: "speakers", label: "Speakers", icon: Mic },
    { key: "scoring", label: "Scores", icon: BarChart3 },
    { key: "pois", label: "POIs", icon: MessageSquare },
    { key: "blocs", label: "Blocs", icon: Shield },
    { key: "agendas", label: "Agendas", icon: BookOpen },
    { key: "updates", label: "Updates", icon: Bell },
    { key: "crisis", label: "Crisis", icon: AlertTriangle },
    { key: "files", label: "Files", icon: FileText },
    { key: "ai", label: "AI", icon: null },
  ];

  return (
    <div className="min-h-screen bg-[#efeeea] flex flex-col">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={munLogo} alt="MUN AI" className="h-10 object-contain" />
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">{committee?.name}</h1>
              <p className="text-xs text-muted-foreground">Chair: {displayName}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleEndSession} className="rounded-xl"><LogOut className="w-5 h-5" /></Button>
        </div>
      </div>

      {conferenceId && (
        <div className="max-w-3xl mx-auto w-full px-4 mt-3">
          <LiveConferenceClock conferenceId={conferenceId} />
        </div>
      )}

      {/* Tab bar - scrollable */}
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

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full p-4 animate-fade-in">
        {/* Delegate Profile Modal */}
        {selectedDelegate && (
          <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedDelegate(null)}>
            <div className="glass-card rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-foreground">{selectedDelegate.name}</h2>
                <button onClick={() => setSelectedDelegate(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
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
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Documents</h3>
                {delegateDocs.length === 0 ? <p className="text-xs text-muted-foreground">No documents submitted</p> : delegateDocs.map((doc: any) => (
                  <div key={doc.id} className="bg-secondary/50 rounded-lg px-3 py-2 mb-1">
                    <span className="text-xs font-medium text-foreground">{doc.doc_type === "position_paper" ? "Position Paper" : "GSL Speech"}</span>
                    <span className={`ml-2 text-xs ${doc.status === "approved" ? "text-accent" : doc.status === "rejected" ? "text-destructive" : "text-muted-foreground"}`}>{doc.status}</span>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">POIs ({delegatePois.length})</h3>
                {delegatePois.length === 0 ? <p className="text-xs text-muted-foreground">No POIs</p> : delegatePois.slice(0, 5).map((poi: any) => (
                  <div key={poi.id} className="bg-secondary/50 rounded-lg px-3 py-2 mb-1 text-xs text-foreground">{poi.content}</div>
                ))}
              </div>

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Bloc Membership</h3>
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
                <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                  <Bell className="w-4 h-4 text-destructive" /> Pending Approvals ({pendingDelegates.length})
                </h2>
                {pendingDelegates.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3 mb-2">
                    <div>
                      <p className="font-medium text-foreground text-sm">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.country}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveDelegate(d.id)} className="rounded-lg gradient-primary border-0 text-xs h-7 px-3"><Check className="w-3 h-3 mr-1" /> Approve</Button>
                      <Button size="sm" variant="ghost" onClick={() => denyDelegate(d.id)} className="rounded-lg text-xs h-7 px-3"><X className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-accent" /> Approved Delegates ({approvedDelegates.length})
              </h2>
              {approvedDelegates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No approved delegates yet.</p>
              ) : (
                <div className="space-y-2">
                  {approvedDelegates.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3 cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => viewDelegateProfile(d)}>
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground text-sm">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.country}</p>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "speakers" && committeeId && conferenceId && (
          <SpeakersList committeeId={committeeId} conferenceId={conferenceId} delegates={delegates} onDelegatesUpdated={loadDelegates} />
        )}

        {tab === "scoring" && committeeId && conferenceId && (
          <ChairScoringSheet committeeId={committeeId} conferenceId={conferenceId} delegates={delegates} committee={committee} onDelegatesUpdated={loadDelegates} />
        )}

        {tab === "pois" && committeeId && conferenceId && (
          <ChairPOIPanel committeeId={committeeId} conferenceId={conferenceId} delegates={delegates} />
        )}

        {tab === "blocs" && committeeId && conferenceId && (
          <BlocsManager committeeId={committeeId} conferenceId={conferenceId} delegates={delegates} />
        )}

        {tab === "agendas" && (
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent" /> Agendas
            </h2>
            {committee?.crisis_enabled && (
              <div className="bg-destructive/10 rounded-xl px-4 py-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-xs text-destructive font-medium">Crisis mode is active</span>
              </div>
            )}
            {agendas.map((a: any) => (
              <div key={a.id} className="bg-secondary/50 rounded-xl px-4 py-3">
                <p className="font-medium text-foreground text-sm">{a.name}</p>
                {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                {a.ai_summary && <p className="text-xs text-accent mt-1">AI Summary: {a.ai_summary}</p>}
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
              <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-accent" /> Push Committee Update
              </h2>
              <p className="text-xs text-muted-foreground">Updates will only be visible to delegates in your committee.</p>
              <Textarea value={updateBody} onChange={(e) => setUpdateBody(e.target.value)} placeholder="Write an update..." className="rounded-xl min-h-[60px]" />
              <Button onClick={pushChairUpdate} className="w-full rounded-xl gradient-primary border-0 font-semibold">Publish</Button>
            </div>
            <div className="space-y-2">
              {updates.map((u: any) => (
                <div key={u.id} className="glass-card rounded-2xl p-4">
                  <p className="text-xs text-accent font-medium mb-1">Update from: {u.author_name} ({u.author_role})</p>
                  {u.title && <h3 className="font-display font-semibold text-foreground text-sm">{u.title}</h3>}
                  <p className="text-sm text-foreground mt-1">{u.body}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(u.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "crisis" && committeeId && conferenceId && (
          <CrisisPanel committeeId={committeeId} conferenceId={conferenceId} committee={committee} />
        )}

        {tab === "files" && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-accent" /> Committee Files
            </h2>
            <p className="text-sm text-muted-foreground text-center py-4">File upload coming soon — storage bucket is ready.</p>
          </div>
        )}

        {tab === "ai" && <AIAssistant />}
      </div>
    </div>
  );
};

export default ChairPortal;
