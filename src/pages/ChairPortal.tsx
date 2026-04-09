import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Users, LogOut, User, Check, X } from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";

const DEVICE_KEY = "munai_chair_device";
function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

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

  useEffect(() => {
    loadInitial();
  }, [conferenceId, committeeId]);

  const loadInitial = async () => {
    if (!conferenceId || !committeeId) return;
    const [comRes, confRes] = await Promise.all([
      supabase.from("committees").select("*").eq("id", committeeId).single(),
      supabase.from("conferences").select("*").eq("id", conferenceId).single(),
    ]);
    setCommittee(comRes.data);
    setConference(confRes.data);

    // Check existing session
    const deviceId = getDeviceId();
    const { data: existingSession } = await supabase
      .from("chair_sessions")
      .select("*")
      .eq("device_id", deviceId)
      .eq("committee_id", committeeId)
      .eq("active", true)
      .maybeSingle() as any;

    if (existingSession) {
      setSessionId(existingSession.id);
      setDisplayName(existingSession.display_name || "");
      setStep("dashboard");
      loadDelegates();
    }
    setLoading(false);
  };

  const loadDelegates = async () => {
    if (!committeeId) return;
    const { data } = await supabase
      .from("delegates")
      .select("*")
      .eq("committee_id", committeeId)
      .order("created_at", { ascending: true }) as any;
    setDelegates(data || []);
  };

  const handleLogin = async () => {
    if (!displayName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    const deviceId = getDeviceId();
    const { data, error } = await supabase.from("chair_sessions").insert({
      device_id: deviceId,
      conference_id: conferenceId!,
      committee_id: committeeId!,
      display_name: displayName.trim(),
      active: true,
    } as any).select().single();

    if (error) {
      toast.error(error.message);
      return;
    }
    setSessionId((data as any).id);
    setStep("dashboard");
    loadDelegates();
    toast.success("Logged in as Chair");
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    await supabase.from("chair_sessions").update({ active: false } as any).eq("id", sessionId);
    localStorage.removeItem(DEVICE_KEY);
    toast.success("Session ended");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#efeeea] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
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
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your full name"
                className="rounded-xl mt-1.5"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full rounded-xl h-11 gradient-primary border-0 font-semibold">
              Enter as Chair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#efeeea] p-4">
      <div className="max-w-3xl mx-auto pt-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={munLogo} alt="MUN AI" className="h-10 object-contain" />
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">{committee?.name}</h1>
              <p className="text-sm text-muted-foreground">Chair: {displayName}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleEndSession} className="rounded-xl">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Delegates List */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-accent" /> Delegates ({delegates.length})
          </h2>
          {delegates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No delegates registered yet.</p>
          ) : (
            <div className="space-y-2">
              {delegates.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground text-sm">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.country}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.active ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground"}`}>
                    {d.active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChairPortal;
