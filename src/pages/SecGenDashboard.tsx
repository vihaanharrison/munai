import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, Plus, Users, Settings, LogOut, Loader2, Trash2, Edit, Power, Eye } from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";
import ScheduleManager from "@/components/ScheduleManager";
import AIAssistant from "@/components/AIAssistant";
import PlannedNotes from "@/components/PlannedNotes";
import ConfirmDialog from "@/components/ConfirmDialog";

const SecGenDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conference, setConference] = useState<any>(null);
  const [conferenceCodes, setConferenceCodes] = useState<any>(null);
  const [committees, setCommittees] = useState<any[]>([]);
  const [committeeChairCodes, setCommitteeChairCodes] = useState<Record<string, string>>({});
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [pendingChairs, setPendingChairs] = useState<any[]>([]);
  const [archiving, setArchiving] = useState(false);
  const [newCommittee, setNewCommittee] = useState("");
  const [newCommitteeType, setNewCommitteeType] = useState<"general" | "specialized" | "crisis">("general");
  const [loading, setLoading] = useState(true);
  const [editingDelegations, setEditingDelegations] = useState<string | null>(null);
  const [delegationsText, setDelegationsText] = useState("");

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    if (!id) return;
    const [confRes, comRes, membersRes, codesRes] = await Promise.all([
      supabase.from("conferences").select("*").eq("id", id).single(),
      supabase.from("committees").select("*").eq("conference_id", id),
      supabase.from("user_roles").select("*").eq("conference_id", id).eq("role", "secretariat" as any),
      supabase.rpc("get_conference_codes", { conf_id: id }),
    ]);
    setConference(confRes.data);
    setConferenceCodes(codesRes.data);
    const comms = (comRes.data as any) || [];
    setCommittees(comms);
    setPendingMembers((membersRes.data as any) || []);

    // Load pending chair sessions for all committees in this conference
    if (comms.length) {
      const { data: chairs } = await supabase.from("chair_sessions").select("*")
        .in("committee_id", comms.map((c: any) => c.id))
        .eq("active", true).eq("approved", false) as any;
      setPendingChairs(chairs || []);
    }

    // Fetch chair codes for each committee via secure RPC
    const chairCodesMap: Record<string, string> = {};
    await Promise.all(comms.map(async (c: any) => {
      const { data } = await supabase.rpc("get_committee_chair_code", { comm_id: c.id });
      if (data) chairCodesMap[c.id] = data as string;
    }));
    setCommitteeChairCodes(chairCodesMap);
    setLoading(false);
  };

  const approveChair = async (sid: string) => {
    await supabase.from("chair_sessions").update({ approved: true } as any).eq("id", sid);
    toast.success("Chair approved");
    loadData();
  };
  const denyChair = async (sid: string) => {
    await supabase.from("chair_sessions").update({ active: false } as any).eq("id", sid);
    toast.success("Chair denied");
    loadData();
  };

  const downloadArchive = async () => {
    if (!id) return;
    setArchiving(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-conference-archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ conferenceId: id }),
      });
      if (!resp.ok) throw new Error("Export failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${conference?.name || "conference"}-archive.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Archive downloaded");
    } catch (e: any) { toast.error(e.message); }
    finally { setArchiving(false); }
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
      conference_id: id, name: newCommittee.trim(), chair_code: chairCode,
      committee_type: newCommitteeType, crisis_enabled: newCommitteeType === "crisis",
    } as any);

    if (error) { toast.error(error.message); } else {
      setNewCommittee("");
      loadData();
      toast.success("Committee added!");
    }
  };

  const saveDelegations = async (committeeId: string) => {
    await supabase.from("committees").update({ delegations: delegationsText } as any).eq("id", committeeId);
    setEditingDelegations(null);
    loadData();
    toast.success("Delegations saved!");
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
    return <div className="min-h-screen gradient-hero flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  if (!conference) {
    return <div className="min-h-screen gradient-hero flex items-center justify-center"><p className="text-muted-foreground">Conference not found</p></div>;
  }

  return (
    <div className="min-h-screen gradient-hero p-4">
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
          <div className="flex items-center gap-2">
            {(() => {
              const start = conference.start_date ? new Date(conference.start_date) : null;
              const day3 = start ? new Date(start.getTime() + 2 * 86400000) : null;
              const canEnd = !!day3 && new Date() >= day3 && !conference.ended_at;
              const ended = !!conference.ended_at;
              if (ended) {
                const endsAt = new Date(new Date(conference.ended_at).getTime() + 48 * 3600000);
                return (
                  <span className="text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-lg" title="Archive download window">
                    Archive open · closes {endsAt.toLocaleDateString()}
                  </span>
                );
              }
              if (canEnd) {
                return (
                  <ConfirmDialog
                    trigger={<Button variant="ghost" size="icon" className="rounded-xl" title="End Conference"><Power className="w-5 h-5 text-destructive" /></Button>}
                    title="End Conference"
                    description="This opens the 48-hour archive window so participants can download all conference data. Data is permanently deleted afterwards. This cannot be undone."
                    onConfirm={async () => {
                      const { error } = await supabase.from("conferences").update({ ended_at: new Date().toISOString() } as any).eq("id", conference.id);
                      if (error) toast.error(error.message); else { toast.success("Conference ended — 48h archive window open"); loadData(); }
                    }}
                    confirmLabel="End Conference"
                    variant="destructive"
                  />
                );
              }
              return null;
            })()}
            <ConfirmDialog
              trigger={<Button variant="ghost" size="icon" className="rounded-xl" title="Exit"><LogOut className="w-5 h-5" /></Button>}
              title="Exit"
              description="You'll be signed out of this device. The conference and all its data stay safe and will be here when you return."
              onConfirm={handleSignOut}
              confirmLabel="Exit"
              variant="destructive"
            />
          </div>
        </div>

        {/* Codes */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Settings className="w-4 h-4 text-accent" /> Conference Codes
          </h2>
          {[
            { label: "Public Link Code", code: conferenceCodes?.public_code || "..." },
            { label: "SecGen Code", code: conferenceCodes?.secgen_code || "..." },
            { label: "Secretariat Code", code: conferenceCodes?.secretariat_code || "..." },
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
          <div className="bg-secondary/50 rounded-xl px-4 py-2.5">
            <span className="text-xs text-muted-foreground">Delegate Registration Link</span>
            <p className="font-mono text-xs text-foreground break-all">{window.location.origin}/delegate/{conference.id}</p>
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/delegate/${conference.id}`); toast.success("Link copied!"); }} className="text-xs text-accent mt-1">Copy link</button>
          </div>
        </div>

        {/* Committees */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-accent" /> Committees
          </h2>
          {committees.map((c: any) => (
            <div key={c.id} className="bg-secondary/50 rounded-xl px-4 py-3 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="text-[10px] uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded">{c.committee_type || "general"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/chair/${id}/${c.id}`)} title="View as observer" className="text-muted-foreground hover:text-accent"><Eye className="w-3.5 h-3.5" /></button>
                  <span className="font-mono text-xs text-muted-foreground">{committeeChairCodes[c.id] || "..."}</span>
                  <button onClick={() => copyCode(committeeChairCodes[c.id] || "", "Chair code")} className="text-muted-foreground hover:text-accent"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { setEditingDelegations(editingDelegations === c.id ? null : c.id); setDelegationsText(c.delegations || ""); }} className="text-muted-foreground hover:text-accent"><Edit className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {/* Delegation matrix */}
              {c.delegations && editingDelegations !== c.id && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.delegations.split(",").map((d: string) => d.trim()).filter(Boolean).map((d: string, i: number) => (
                    <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{d}</span>
                  ))}
                </div>
              )}
              {editingDelegations === c.id && (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={delegationsText}
                    onChange={(e) => setDelegationsText(e.target.value)}
                    placeholder="Enter delegations comma-separated, e.g. USA, China, France, India"
                    className="rounded-xl text-xs min-h-[60px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveDelegations(c.id)} className="rounded-lg gradient-primary border-0 text-xs">Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingDelegations(null)} className="rounded-lg text-xs">Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="mt-3 space-y-2">
            <div className="flex gap-1">
              {(["general", "specialized", "crisis"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setNewCommitteeType(t)}
                  className={`flex-1 text-[11px] font-medium py-1.5 rounded-lg capitalize transition-colors ${newCommitteeType === t ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newCommittee} onChange={(e) => setNewCommittee(e.target.value)} placeholder="Committee name" className="rounded-xl" onKeyDown={(e) => e.key === "Enter" && addCommittee()} />
              <Button onClick={addCommittee} className="rounded-xl gradient-primary border-0"><Plus className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>

        {/* Pending Members */}
        {pendingMembers.filter((m: any) => !m.approved).length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-semibold text-foreground mb-3">Pending Approvals</h2>
            {pendingMembers.filter((m: any) => !m.approved).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-2.5 mb-2">
                <span className="text-foreground">{m.display_name || "Unknown"}</span>
                <Button size="sm" onClick={() => approveMember(m.id)} className="rounded-lg gradient-accent border-0 text-xs">Approve</Button>
              </div>
            ))}
          </div>
        )}

        {/* Schedule */}
        {conferenceDays.length > 0 && <ScheduleManager conferenceId={id!} conferenceDays={conferenceDays} />}

        {/* AI */}
        <AIAssistant />
      </div>

      <PlannedNotes ownerType="secgen" ownerId={conference.secgen_user_id || id!} conferenceId={id} />
    </div>
  );
};

export default SecGenDashboard;
