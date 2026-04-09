import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, BookOpen, Clock } from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";
import LiveConferenceClock from "@/components/LiveConferenceClock";

const DELEGATE_DEVICE_KEY = "munai_delegate_device";
function getDeviceId() {
  let id = localStorage.getItem(DELEGATE_DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DELEGATE_DEVICE_KEY, id);
  }
  return id;
}

const DelegateRegister = () => {
  const { conferenceId } = useParams<{ conferenceId: string }>();
  const [conference, setConference] = useState<any>(null);
  const [committees, setCommittees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"register" | "dashboard">("register");
  const [delegate, setDelegate] = useState<any>(null);

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [committeeId, setCommitteeId] = useState("");

  useEffect(() => {
    loadData();
  }, [conferenceId]);

  const loadData = async () => {
    if (!conferenceId) return;
    const [confRes, comRes] = await Promise.all([
      supabase.from("conferences").select("*").eq("id", conferenceId).single(),
      supabase.from("committees").select("*").eq("conference_id", conferenceId),
    ]);
    setConference(confRes.data);
    setCommittees((comRes.data as any) || []);

    // Check existing delegate session
    const deviceId = getDeviceId();
    const { data: existing } = await supabase
      .from("delegates")
      .select("*")
      .eq("device_id", deviceId)
      .eq("conference_id", conferenceId)
      .eq("active", true)
      .maybeSingle() as any;

    if (existing) {
      setDelegate(existing);
      setStep("dashboard");
    }
    setLoading(false);
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
    } as any).select().single();

    if (error) {
      toast.error(error.message);
      return;
    }
    setDelegate(data);
    setStep("dashboard");
    toast.success("Registered successfully!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#efeeea] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (step === "register") {
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
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="rounded-xl mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Country / Delegation</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. United States"
                className="rounded-xl mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Committee</Label>
              <Select value={committeeId} onValueChange={setCommitteeId}>
                <SelectTrigger className="rounded-xl mt-1.5">
                  <SelectValue placeholder="Select committee" />
                </SelectTrigger>
                <SelectContent>
                  {committees.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleRegister} className="w-full rounded-xl h-11 gradient-primary border-0 font-semibold">
              Register
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const selectedCommittee = committees.find((c: any) => c.id === delegate?.committee_id);

  return (
    <div className="min-h-screen bg-[#efeeea] p-4">
      <div className="max-w-2xl mx-auto pt-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <img src={munLogo} alt="MUN AI" className="h-10 object-contain" />
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{delegate?.name}</h1>
            <p className="text-sm text-muted-foreground">{delegate?.country} · {selectedCommittee?.name}</p>
          </div>
        </div>

        {/* Live Clock */}
        {conferenceId && <LiveConferenceClock conferenceId={conferenceId} />}

        <div className="glass-card rounded-2xl p-5 mt-4">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-accent" /> Committee Info
          </h2>
          <p className="text-sm text-muted-foreground">
            You are registered for <strong>{selectedCommittee?.name}</strong>.
            {selectedCommittee?.topic && <> Topic: <strong>{selectedCommittee.topic}</strong></>}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DelegateRegister;
