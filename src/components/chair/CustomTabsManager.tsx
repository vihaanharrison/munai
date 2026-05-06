import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Settings, Layers } from "lucide-react";
import { toast } from "sonner";

interface TabDef { id: string; label: string; description?: string; fields: { key: string; label: string; type: "text" | "textarea" }[] }

interface Props {
  committeeId: string;
  conferenceId?: string;
  committee: any;
  isStandalone?: boolean;
  readOnly?: boolean;
  authorName?: string;
}

const CustomTabsManager = ({ committeeId, conferenceId, committee, isStandalone, readOnly, authorName }: Props) => {
  const [tabs, setTabs] = useState<TabDef[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [newTabLabel, setNewTabLabel] = useState("");
  const [newFieldsText, setNewFieldsText] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const t = (committee?.custom_tabs as TabDef[]) || [];
    setTabs(t);
    if (t.length && !activeTabId) setActiveTabId(t[0].id);
  }, [committee]);

  const loadEntries = useCallback(async () => {
    if (!activeTabId) return;
    const { data } = await supabase.from("custom_tab_entries")
      .select("*").eq("committee_id", committeeId).eq("tab_id", activeTabId)
      .order("created_at", { ascending: false }) as any;
    setEntries(data || []);
  }, [activeTabId, committeeId]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  useEffect(() => {
    const ch = supabase.channel(`custom-tabs-${committeeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "custom_tab_entries", filter: `committee_id=eq.${committeeId}` }, () => loadEntries())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [committeeId, loadEntries]);

  const persistTabs = async (next: TabDef[]) => {
    const table = isStandalone ? "standalone_committees" : "committees";
    const { error } = await supabase.from(table).update({ custom_tabs: next as any } as any).eq("id", committeeId);
    if (error) { toast.error(error.message); return; }
    setTabs(next);
  };

  const addTab = async () => {
    if (!newTabLabel.trim()) return;
    const fields = newFieldsText.split(",").map((f) => f.trim()).filter(Boolean).map((f) => ({
      key: f.toLowerCase().replace(/[^a-z0-9]/g, "_"), label: f, type: "text" as const,
    }));
    if (fields.length === 0) { toast.error("Add at least one field"); return; }
    const next: TabDef[] = [...tabs, { id: crypto.randomUUID(), label: newTabLabel.trim(), fields }];
    await persistTabs(next);
    setNewTabLabel(""); setNewFieldsText("");
    toast.success("Tab added");
  };

  const removeTab = async (tabId: string) => {
    const next = tabs.filter((t) => t.id !== tabId);
    await persistTabs(next);
    if (activeTabId === tabId) setActiveTabId(next[0]?.id || null);
  };

  const submitEntry = async () => {
    if (!activeTabId) return;
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return;
    const missing = tab.fields.find((f) => !draft[f.key]?.trim());
    if (missing) { toast.error(`${missing.label} is required`); return; }
    const { error } = await supabase.from("custom_tab_entries").insert({
      committee_id: committeeId, conference_id: conferenceId || null,
      tab_id: activeTabId, payload: draft, author: authorName || "Anonymous",
    } as any);
    if (error) { toast.error(error.message); return; }
    setDraft({});
    toast.success("Submitted");
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("custom_tab_entries").delete().eq("id", id);
  };

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" /> Custom Tabs
          </h2>
          {!readOnly && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)} className="rounded-lg text-xs h-7">
              <Settings className="w-3 h-3 mr-1" /> {editing ? "Done" : "Manage"}
            </Button>
          )}
        </div>

        {tabs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No custom tabs yet. {!readOnly && "Click Manage to add one."}</p>
        ) : (
          <div className="flex flex-wrap gap-1 mb-3">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setActiveTabId(t.id)}
                className={`text-xs font-medium py-1.5 px-3 rounded-lg transition-colors ${activeTabId === t.id ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {editing && (
          <div className="bg-secondary/40 rounded-xl p-3 space-y-2 mb-3">
            <Label className="text-xs">New tab label</Label>
            <Input value={newTabLabel} onChange={(e) => setNewTabLabel(e.target.value)} className="rounded-lg text-xs h-8" placeholder="e.g. Directives" />
            <Label className="text-xs">Fields (comma-separated)</Label>
            <Input value={newFieldsText} onChange={(e) => setNewFieldsText(e.target.value)} className="rounded-lg text-xs h-8" placeholder="Title, Summary, Sponsors" />
            <Button size="sm" onClick={addTab} className="rounded-lg gradient-primary border-0 text-xs"><Plus className="w-3 h-3 mr-1" /> Add tab</Button>
            {tabs.length > 0 && (
              <div className="pt-2 border-t border-border space-y-1">
                {tabs.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{t.label} <span className="text-muted-foreground">({t.fields.length} fields)</span></span>
                    <button onClick={() => removeTab(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab && !readOnly && (
          <div className="bg-secondary/40 rounded-xl p-3 space-y-2 mb-3">
            <p className="text-xs font-semibold text-foreground">New {activeTab.label} entry</p>
            {activeTab.fields.map((f) => (
              <div key={f.key}>
                <Label className="text-xs text-muted-foreground">{f.label}</Label>
                <Textarea value={draft[f.key] || ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  className="rounded-lg text-xs min-h-[40px] mt-1" />
              </div>
            ))}
            <Button size="sm" onClick={submitEntry} className="rounded-lg gradient-primary border-0 text-xs w-full">Submit</Button>
          </div>
        )}

        {activeTab && (
          <div className="space-y-2">
            {entries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No entries yet.</p>
            ) : entries.map((e: any) => (
              <div key={e.id} className="bg-secondary/30 rounded-xl p-3">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-[10px] uppercase text-muted-foreground tracking-wide">{e.author} · {new Date(e.created_at).toLocaleString()}</p>
                  {!readOnly && (
                    <button onClick={() => deleteEntry(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                  )}
                </div>
                {activeTab.fields.map((f) => (
                  e.payload?.[f.key] ? (
                    <div key={f.key} className="mt-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">{f.label}</p>
                      <p className="text-xs text-foreground whitespace-pre-wrap">{e.payload[f.key]}</p>
                    </div>
                  ) : null
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomTabsManager;
