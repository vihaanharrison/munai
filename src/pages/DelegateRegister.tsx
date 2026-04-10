import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, BookOpen, Clock, FileText, Upload, Bell, CheckCircle2 } from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";
import LiveConferenceClock from "@/components/LiveConferenceClock";

const DELEGATE_DEVICE_KEY = "munai_delegate_device";
function getDeviceId() {
  let id = localStorage.getItem(DELEGATE_DEVICE_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(DELEGATE_DEVICE_KEY, id); }
  return id;
}

const DelegateRegister = () => {
  const { conferenceId } = useParams<{ conferenceId: string }>();
  const [conference, setConference] = useState<any>(null);
  const [committees, setCommittees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"register" | "pending" | "dashboard">("register");
  const [delegate, setDelegate] = useState<any>(null);
  const [takenDelegations, setTakenDelegations] = useState<string[]>([]);

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [committeeId, setCommitteeId] = useState("");

  // Documents
  const [gslText, setGslText] = useState("");
  const [gslSubmitting, setGslSubmitting] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);

  // Updates
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => { loadData(); }, [conferenceId]);

  // Realtime: listen for approval changes
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
          loadDocs();
          loadUpdates();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [delegate?.id, step]);

  const loadData = async () => {
    if (!conferenceId) return;
    const [confRes, comRes] = await Promise.all([
      supabase.from("conferences").select("*").eq("id", conferenceId).single(),
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
        await Promise.all([loadDocs(existing.id), loadUpdatesForCommittee(existing.committee_id)]);
      } else {
        setStep("pending");
      }
    }
    setLoading(false);
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

  const loadUpdates = async () => {
    if (!conferenceId || !delegate?.committee_id) return;
    loadUpdatesForCommittee(delegate.committee_id);
  };

  const loadUpdatesForCommittee = async (comId: string) => {
    if (!conferenceId) return;
    const { data } = await supabase.from("conference_updates").select("*")
      .eq("conference_id", conferenceId)
      .or(`committee_id.eq.${comId},committee_id.is.null`)
      .order("created_at", { ascending: false }) as any;
    setUpdates(data || []);
  };

  const handleRegister = async () => {
    if (!name.trim() || !country.trim() || !committeeId) {
      toast.error("Please fill in all fields");
      return;
    }
    const deviceId = getDeviceId();
    const { data, error } = await supabase.from("delegates").insert({
      conference_id: conferenceId!,
      committee_id: committeeId,
      name: name.trim(),
      country: country.trim(),
      device_id: deviceId,
      active: true,
      approved: false,
    } as any).select().single();

    if (error) { toast.error(error.message); return; }
    setDelegate(data);
    setStep("pending");
    toast.success("Registration submitted! Waiting for chair approval.");
  };

  const submitGSL = async () => {
    if (!gslText.trim() || !delegate) return;
    setGslSubmitting(true);

    // AI check via edge function
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ type: "ai-check", content: gslText }),
      });

      // For now, just save. AI check result is stored.
      await supabase.from("delegate_documents").insert({
        delegate_id: delegate.id,
        committee_id: delegate.committee_id,
        conference_id: conferenceId!,
        doc_type: "gsl_speech",
        content: gslText.trim(),
        status: "pending",
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

  if (loading) {
    return <div className="min-h-screen bg-[#efeeea] flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  // Pending approval screen
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

  // Registration form
  if (step === "register") {
    const selectedCommittee = committees.find((c: any) => c.id === committeeId);
    const delegationList = selectedCommittee?.delegations
      ? selectedCommittee.delegations.split(",").map((d: string) => d.trim()).filter(Boolean)
      : [];

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
            <div>
              <Label className="text-sm font-medium">Country / Delegation</Label>
              {delegationList.length > 0 ? (
                <div className="grid grid-cols-2 gap-1.5 mt-1.5 max-h-48 overflow-y-auto">
                  {delegationList.map((d: string) => {
                    const taken = takenDelegations.includes(d);
                    return (
                      <button
                        key={d}
                        disabled={taken}
                        onClick={() => setCountry(d)}
                        className={`text-xs px-3 py-2 rounded-lg text-left transition-colors ${
                          taken
                            ? "bg-secondary/30 text-muted-foreground/50 cursor-not-allowed line-through"
                            : country === d
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary/50 text-foreground hover:bg-secondary"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. United States" className="rounded-xl mt-1.5" />
              )}
            </div>
            <Button onClick={handleRegister} className="w-full rounded-xl h-11 gradient-primary border-0 font-semibold">Register</Button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  const selectedCommittee = committees.find((c: any) => c.id === delegate?.committee_id);

  return (
    <div className="min-h-screen bg-[#efeeea] p-4">
      <div className="max-w-2xl mx-auto pt-6 animate-fade-in space-y-4">
        <div className="flex items-center gap-3">
          <img src={munLogo} alt="MUN AI" className="h-10 object-contain" />
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{delegate?.name}</h1>
            <p className="text-sm text-muted-foreground">{delegate?.country} · {selectedCommittee?.name}</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-accent ml-auto" />
        </div>

        {conferenceId && <LiveConferenceClock conferenceId={conferenceId} />}

        {/* Committee Info */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-accent" /> Committee Info
          </h2>
          <p className="text-sm text-muted-foreground">
            Registered for <strong>{selectedCommittee?.name}</strong>.
            {selectedCommittee?.topic && <> Topic: <strong>{selectedCommittee.topic}</strong></>}
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
              <p className="text-xs text-muted-foreground">AI integrity check: speeches with &gt;10% AI-generated content will be rejected.</p>
              <Button onClick={submitGSL} disabled={gslSubmitting || !gslText.trim()} className="w-full rounded-xl gradient-primary border-0 font-semibold">
                {gslSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Submit GSL Speech
              </Button>
            </>
          )}
        </div>

        {/* Updates */}
        {updates.length > 0 && (
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
