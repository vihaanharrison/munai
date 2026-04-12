import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Minimize2, Maximize2, X } from "lucide-react";

interface PlannedNotesProps {
  ownerType: "secgen" | "chair";
  ownerId: string;
  conferenceId?: string;
  committeeId?: string;
}

const PlannedNotes = ({ ownerType, ownerId, conferenceId, committeeId }: PlannedNotesProps) => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [content, setContent] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNote();
  }, [ownerId]);

  const loadNote = async () => {
    const query = supabase.from("planned_notes" as any).select("*").eq("owner_type", ownerType).eq("owner_id", ownerId);
    const { data } = await query.maybeSingle() as any;
    if (data) {
      setNoteId(data.id);
      setContent(data.content || "");
    }
  };

  const saveNote = useCallback(async (text: string) => {
    setSaving(true);
    if (noteId) {
      await supabase.from("planned_notes" as any).update({ content: text, updated_at: new Date().toISOString() } as any).eq("id", noteId);
    } else {
      const { data } = await supabase.from("planned_notes" as any).insert({
        owner_type: ownerType,
        owner_id: ownerId,
        conference_id: conferenceId || null,
        committee_id: committeeId || null,
        content: text,
      } as any).select().single() as any;
      if (data) setNoteId(data.id);
    }
    setSaving(false);
  }, [noteId, ownerType, ownerId, conferenceId, committeeId]);

  useEffect(() => {
    const timer = setTimeout(() => { if (content) saveNote(content); }, 1000);
    return () => clearTimeout(timer);
  }, [content, saveNote]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full gradient-accent border-0 shadow-elevated flex items-center justify-center hover:scale-105 transition-transform"
        title="Planned Notes"
      >
        <StickyNote className="w-5 h-5 text-accent-foreground" />
      </button>
    );
  }

  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 glass-card rounded-2xl shadow-elevated px-4 py-2 flex items-center gap-2 cursor-pointer" onClick={() => setMinimized(false)}>
        <StickyNote className="w-4 h-4 text-accent" />
        <span className="text-xs font-medium text-foreground">Notes</span>
        <Maximize2 className="w-3 h-3 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 glass-card rounded-2xl shadow-elevated w-80 max-h-[400px] flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Planned Notes</span>
          {saving && <span className="text-[10px] text-muted-foreground">Saving...</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(true)} className="p-1 rounded hover:bg-secondary"><Minimize2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-secondary"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
        </div>
      </div>
      <div className="p-3 flex-1">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your notes here... They auto-save."
          className="rounded-xl min-h-[250px] resize-none border-0 bg-transparent focus-visible:ring-0 text-sm"
        />
      </div>
    </div>
  );
};

export default PlannedNotes;
