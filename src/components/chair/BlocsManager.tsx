import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Users, Edit2, Check, Crown, FileText } from "lucide-react";

interface Props {
  committeeId: string;
  conferenceId: string;
  delegates: any[];
}

const STATUSES = [
  { value: "yet_to_discuss", label: "Yet to Discuss" },
  { value: "being_discussed", label: "Being Discussed" },
  { value: "done", label: "Done" },
];

const BlocsManager = ({ committeeId, conferenceId, delegates }: Props) => {
  const [blocs, setBlocs] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [newBlocName, setNewBlocName] = useState("");
  const [editingBlocId, setEditingBlocId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const approvedDelegates = delegates.filter((d) => d.approved);

  const loadBlocs = useCallback(async () => {
    const { data } = await supabase.from("blocs").select("*").eq("committee_id", committeeId).order("created_at") as any;
    setBlocs(data || []);
  }, [committeeId]);

  const loadMemberships = useCallback(async () => {
    const { data } = await supabase.from("delegate_blocs").select("*").eq("committee_id", committeeId) as any;
    setMemberships(data || []);
  }, [committeeId]);

  useEffect(() => { loadBlocs(); loadMemberships(); }, [loadBlocs, loadMemberships]);

  const createBloc = async () => {
    if (!newBlocName.trim()) return;
    await supabase.from("blocs").insert({
      committee_id: committeeId,
      conference_id: conferenceId,
      name: newBlocName.trim(),
    } as any);
    setNewBlocName("");
    loadBlocs();
    toast.success("Bloc created");
  };

  const renameBloc = async (blocId: string) => {
    if (!editName.trim()) return;
    await supabase.from("blocs").update({ name: editName.trim() } as any).eq("id", blocId);
    setEditingBlocId(null);
    loadBlocs();
    toast.success("Bloc renamed");
  };

  const updateStatus = async (blocId: string, status: string) => {
    await supabase.from("blocs").update({ discussion_status: status } as any).eq("id", blocId);
    loadBlocs();
  };

  const toggleLeader = async (membershipId: string, currentLeader: boolean) => {
    await supabase.from("delegate_blocs").update({ is_leader: !currentLeader } as any).eq("id", membershipId);
    loadMemberships();
    toast.success(currentLeader ? "Leader status removed" : "Set as bloc leader");
  };

  const getDName = (id: string) => {
    const d = approvedDelegates.find((d) => d.id === id);
    return d ? `${d.country}` : "Unknown";
  };

  const getBlocMembers = (blocId: string) => {
    return memberships.filter((m) => m.bloc_id === blocId || m.bloc_name === blocs.find((b) => b.id === blocId)?.name);
  };

  return (
    <div className="space-y-4">
      {/* Create Bloc */}
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-accent" /> Blocs & Directives
        </h2>
        <div className="flex gap-2">
          <Input value={newBlocName} onChange={(e) => setNewBlocName(e.target.value)} placeholder="New bloc name..." className="rounded-xl flex-1" onKeyDown={(e) => e.key === "Enter" && createBloc()} />
          <Button onClick={createBloc} className="rounded-xl gradient-primary border-0"><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Bloc List */}
      {blocs.map((bloc) => {
        const members = getBlocMembers(bloc.id);
        const statusObj = STATUSES.find((s) => s.value === (bloc.discussion_status || "yet_to_discuss"));

        return (
          <div key={bloc.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              {editingBlocId === bloc.id ? (
                <div className="flex gap-2 flex-1 mr-2">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl text-sm flex-1" />
                  <Button size="sm" onClick={() => renameBloc(bloc.id)} className="rounded-lg gradient-primary border-0 text-xs h-8">
                    <Check className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-foreground text-sm">{bloc.name}</h3>
                  <button onClick={() => { setEditingBlocId(bloc.id); setEditName(bloc.name); }} className="text-muted-foreground hover:text-foreground">
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              <Select value={bloc.discussion_status || "yet_to_discuss"} onValueChange={(v) => updateStatus(bloc.id, v)}>
                <SelectTrigger className="w-40 rounded-lg text-xs h-7">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status badge */}
            <div className="mb-3">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                statusObj?.value === "done" ? "bg-accent/10 text-accent" :
                statusObj?.value === "being_discussed" ? "bg-primary/10 text-primary" :
                "bg-secondary text-muted-foreground"
              }`}>
                {statusObj?.label}
              </span>
            </div>

            {/* File/Directive */}
            {bloc.file_url && (
              <div className="bg-secondary/50 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                <a href={bloc.file_url} target="_blank" rel="noreferrer" className="text-xs text-accent underline">
                  {bloc.file_name || "Directive Document"}
                </a>
              </div>
            )}

            {/* Members */}
            {members.length === 0 ? (
              <p className="text-xs text-muted-foreground">No members yet. Delegates can join from their portal.</p>
            ) : (
              <div className="space-y-1">
                {members.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-3 py-2">
                    <span className="text-sm text-foreground">{getDName(m.delegate_id)}</span>
                    <button onClick={() => toggleLeader(m.id, m.is_leader)} className={`flex items-center gap-1 text-xs ${m.is_leader ? "text-accent font-medium" : "text-muted-foreground"}`}>
                      <Crown className={`w-3 h-3 ${m.is_leader ? "text-accent" : ""}`} />
                      {m.is_leader ? "Leader" : "Set Leader"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {blocs.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-4">No blocs created yet.</div>
      )}
    </div>
  );
};

export default BlocsManager;
