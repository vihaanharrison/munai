import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Calendar } from "lucide-react";

interface Props {
  conferenceId: string;
  conferenceDays: string[]; // array of date strings "YYYY-MM-DD"
}

interface Session {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  day_date: string;
  sort_order: number | null;
}

const ScheduleManager = ({ conferenceId, conferenceDays }: Props) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedDay, setSelectedDay] = useState(conferenceDays[0] || "");
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  useEffect(() => {
    loadSessions();
  }, [conferenceId]);

  const loadSessions = async () => {
    const { data } = await supabase
      .from("schedule_sessions")
      .select("*")
      .eq("conference_id", conferenceId)
      .order("day_date")
      .order("start_time") as any;
    setSessions(data || []);
  };

  const addSession = async () => {
    if (!newName.trim() || !newStart || !newEnd || !selectedDay) {
      toast.error("Fill in all fields");
      return;
    }
    const { error } = await supabase.from("schedule_sessions").insert({
      conference_id: conferenceId,
      day_date: selectedDay,
      name: newName.trim(),
      start_time: newStart,
      end_time: newEnd,
      sort_order: sessions.filter((s) => s.day_date === selectedDay).length,
    } as any);

    if (error) {
      toast.error(error.message);
    } else {
      setNewName("");
      setNewStart("");
      setNewEnd("");
      loadSessions();
      toast.success("Session added");
    }
  };

  const deleteSession = async (id: string) => {
    await supabase.from("schedule_sessions").delete().eq("id", id);
    loadSessions();
    toast.success("Session removed");
  };

  const daySessions = sessions.filter((s) => s.day_date === selectedDay);

  return (
    <div className="glass-card rounded-2xl p-5">
      <h2 className="font-display font-semibold text-foreground flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-accent" /> Schedule
      </h2>

      {/* Day tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {conferenceDays.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              selectedDay === day
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            {new Date(day + "T00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </button>
        ))}
      </div>

      {/* Sessions table */}
      <div className="space-y-2 mb-4">
        {daySessions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No sessions for this day yet.</p>
        )}
        {daySessions.map((s) => (
          <div key={s.id} className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-2.5">
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">{s.name}</p>
            </div>
            <span className="text-xs text-muted-foreground font-mono">{s.start_time}</span>
            <span className="text-xs text-muted-foreground">—</span>
            <span className="text-xs text-muted-foreground font-mono">{s.end_time}</span>
            <button onClick={() => deleteSession(s.id)} className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Session name"
          className="rounded-xl flex-1"
        />
        <Input
          type="time"
          value={newStart}
          onChange={(e) => setNewStart(e.target.value)}
          className="rounded-xl w-28"
        />
        <Input
          type="time"
          value={newEnd}
          onChange={(e) => setNewEnd(e.target.value)}
          className="rounded-xl w-28"
        />
        <Button onClick={addSession} className="rounded-xl gradient-primary border-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ScheduleManager;
