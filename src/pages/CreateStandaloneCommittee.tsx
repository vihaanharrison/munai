import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Copy, Check } from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";
import SpecializedTemplates, { PRESETS, type SpecializedPreset } from "@/components/chair/SpecializedTemplates";

function generateCode(length: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

const CreateStandaloneCommittee = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [delegations, setDelegations] = useState("");
  const [committeeType, setCommitteeType] = useState<"general" | "specialized" | "crisis">("general");
  const [preset, setPreset] = useState<SpecializedPreset>("none");
  const [created, setCreated] = useState<{ committeeCode: string; chairCode: string; id: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Committee name is required"); return; }
    setLoading(true);
    const committeeCode = generateCode(6);
    const chairCode = committeeCode + generateCode(2);
    const deviceId = localStorage.getItem("munai_chair_device") || crypto.randomUUID();
    localStorage.setItem("munai_chair_device", deviceId);
    // Reuse the same device id for the standalone-chair portal so the creator auto-resumes
    if (!localStorage.getItem("munai_standalone_chair")) {
      localStorage.setItem("munai_standalone_chair", deviceId);
    }
    const { data: auth } = await supabase.auth.getUser();

    const { data, error } = await supabase.from("standalone_committees").insert({
      name: name.trim(),
      topic: topic.trim() || null,
      delegations: delegations.trim(),
      committee_code: committeeCode,
      chair_code: chairCode,
      created_by_device_id: deviceId,
      created_by_user_id: auth?.user?.id ?? null,
      committee_type: committeeType,
      crisis_enabled: committeeType === "crisis",
      crisis_mode_active: committeeType === "crisis",
    } as any).select().single();

    if (error) { toast.error(error.message); setLoading(false); return; }
    setCreated({ committeeCode, chairCode, id: (data as any).id });
    setLoading(false);
    toast.success("Standalone committee created!");
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  if (created) {
    return (
      <div className="min-h-screen bg-[#efeeea] flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex flex-col items-center mb-6">
            <img src={munLogo} alt="MUN AI" className="h-20 object-contain mb-4" />
            <h1 className="font-display text-xl font-bold text-foreground">Committee Created!</h1>
          </div>
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="bg-secondary/50 rounded-xl px-4 py-3">
              <span className="text-xs text-muted-foreground">Committee Code (share with delegates)</span>
              <div className="flex items-center justify-between mt-1">
                <p className="font-mono text-lg font-bold text-foreground tracking-widest">{created.committeeCode}</p>
                <button onClick={() => copy(created.committeeCode, "Committee code")}><Copy className="w-4 h-4 text-muted-foreground hover:text-accent" /></button>
              </div>
            </div>
            <div className="bg-secondary/50 rounded-xl px-4 py-3">
              <span className="text-xs text-muted-foreground">Chair Code (share with co-chairs only)</span>
              <div className="flex items-center justify-between mt-1">
                <p className="font-mono text-lg font-bold text-foreground tracking-widest">{created.chairCode}</p>
                <button onClick={() => copy(created.chairCode, "Chair code")}><Copy className="w-4 h-4 text-muted-foreground hover:text-accent" /></button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">The 6-character code is for delegates. The 8-character code includes chair access.</p>
            <Button onClick={() => navigate(`/standalone/${created.id}`)} className="w-full rounded-xl h-11 gradient-primary border-0 font-semibold">
              Enter as Chair
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="w-full rounded-xl">Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#efeeea] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <img src={munLogo} alt="MUN AI" className="h-20 object-contain mb-4" />
          <h1 className="font-display text-xl font-bold text-foreground">Create Standalone Committee</h1>
          <p className="text-sm text-muted-foreground mt-1">No full conference needed — just a committee.</p>
        </div>
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <Label className="text-sm font-medium">Committee Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. DISEC, Crisis Cabinet" className="rounded-xl mt-1.5" />
          </div>
          <div>
            <Label className="text-sm font-medium">Committee Type *</Label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {(["general", "specialized", "crisis"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setCommitteeType(t)}
                  className={`text-xs font-medium py-2 rounded-xl transition-colors capitalize ${committeeType === t ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}>
                  {t}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {committeeType === "crisis" ? "Crisis tools, triggers & timeline enabled." : committeeType === "specialized" ? "Smaller committee with deeper scoring." : "Standard GA-style flow."}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Topic (optional)</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Nuclear Disarmament" className="rounded-xl mt-1.5" />
          </div>
          <div>
            <Label className="text-sm font-medium">Delegation Matrix</Label>
            <Textarea value={delegations} onChange={(e) => setDelegations(e.target.value)} placeholder="Enter comma-separated, e.g. USA, China, France, India" className="rounded-xl mt-1.5 min-h-[80px]" />
            {delegations && (
              <div className="flex flex-wrap gap-1 mt-2">
                {delegations.split(",").map((d) => d.trim()).filter(Boolean).map((d, i) => (
                  <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{d}</span>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleCreate} disabled={loading} className="w-full rounded-xl h-11 gradient-primary border-0 font-semibold">
            {loading ? "Creating..." : "Create Committee"}
          </Button>
          <Button variant="ghost" onClick={() => navigate("/")} className="w-full rounded-xl flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateStandaloneCommittee;
