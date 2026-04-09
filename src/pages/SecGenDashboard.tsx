import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, Plus, Users, Settings, LogOut, Loader2 } from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";
import ScheduleManager from "@/components/ScheduleManager";
import AIAssistant from "@/components/AIAssistant";

const SecGenDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conference, setConference] = useState<any>(null);
  const [committees, setCommittees] = useState<any[]>([]);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [newCommittee, setNewCommittee] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    const [confRes, comRes, membersRes] = await Promise.all([
      supabase.from("conferences").select("*").eq("id", id).single(),
      supabase.from("committees").select("*").eq("conference_id", id),
      supabase.from("user_roles").select("*").eq("conference_id", id).eq("role", "secretariat" as any),
    ]);
    setConference(confRes.data);
    setCommittees((comRes.data as any) || []);
    setPendingMembers((membersRes.data as any) || []);
    setLoading(false);
  };

  const conferenceDays = useMemo(() => {
    if (!conference?.start_date || !conference?.end_date) return [];
    const days: string[] = [];
    const start = new Date(conference.start_date + "T00:00");
    const end = new Date(conference.end_date + "T00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  }, [conference]);

  const copyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`${label} copied!`);
  };

  const addCommittee = async () => {
    if (!newCommittee.trim() || !id) return;
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let chairCode = "";
    for (let i = 0; i < 8; i++) chairCode += chars[Math.floor(Math.random() * chars.length)];

    const { error } = await supabase.from("committees").insert({
      conference_id: id,
      name: newCommittee.trim(),
      chair_code: chairCode,
    } as any);

    if (error) {
      toast.error(error.message);
    } else {
      setNewCommittee("");
      loadData();
      toast.success("Committee added!");
    }
  };

  const approveMember = async (roleId: string) => {
    await supabase.from("user_roles").update({ approved: true } as any).eq("id", roleId);
    loadData();
    toast.success("Member approved!");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#efeeea] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!conference) {
    return (
      <div className="min-h-screen bg-[#efeeea] flex items-center justify-center">
        <p className="text-muted-foreground">Conference not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#efeeea] p-4">
      <div className="max-w-3xl mx-auto pt-6 animate-fade-in space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={munLogo} alt="MUN AI" className="h-10 object-contain" />
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">{conference.name}</h1>
              <p className="text-sm text-muted-foreground">Secretary General Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-xl">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Codes */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Settings className="w-4 h-4 text-accent" /> Conference Codes
          </h2>
          {[
            { label: "Public Link Code", code: conference.public_code },
            { label: "SecGen Code", code: conference.secgen_code },
            { label: "Secretariat Code", code: conference.secretariat_code },
          ].map(({ label, code }) => (
            <div key={label} className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-2.5">
              <div>
                <span className="text-xs text-muted-foreground">{label}</span>
                <p className="font-mono font-semibold text-foreground tracking-wider">{code}</p>
              </div>
              <button onClick={() => copyCode(code, label)} className="text-muted-foreground hover:text-accent transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Committees */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-accent" /> Committees
          </h2>
          {committees.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-2.5 mb-2">
              <span className="font-medium text-foreground">{c.name}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{c.chair_code}</span>
                <button onClick={() => copyCode(c.chair_code, "Chair code")} className="text-muted-foreground hover:text-accent">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-3">
            <Input
              value={newCommittee}
              onChange={(e) => setNewCommittee(e.target.value)}
              placeholder="Committee name"
              className="rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && addCommittee()}
            />
            <Button onClick={addCommittee} className="rounded-xl gradient-primary border-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Pending Members */}
        {pendingMembers.filter((m: any) => !m.approved).length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-semibold text-foreground mb-3">Pending Approvals</h2>
            {pendingMembers
              .filter((m: any) => !m.approved)
              .map((m: any) => (
                <div key={m.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-2.5 mb-2">
                  <span className="text-foreground">{m.display_name || "Unknown"}</span>
                  <Button size="sm" onClick={() => approveMember(m.id)} className="rounded-lg gradient-accent border-0 text-xs">
                    Approve
                  </Button>
                </div>
              ))}
          </div>
        )}

        {/* Schedule Manager */}
        {conferenceDays.length > 0 && (
          <ScheduleManager conferenceId={id!} conferenceDays={conferenceDays} />
        )}

        {/* AI Assistant */}
        <AIAssistant />
      </div>
    </div>
  );
};

export default SecGenDashboard;
