import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";

interface Props {
  conferenceId: string;
}

interface Session {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  day_date: string;
}

const LiveConferenceClock = ({ conferenceId }: Props) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [now, setNow] = useState(new Date());
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [nextSession, setNextSession] = useState<Session | null>(null);

  useEffect(() => {
    loadSessions();
  }, [conferenceId]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!sessions.length) return;
    const todayStr = now.toISOString().split("T")[0];
    const nowTime = now.getHours() * 60 + now.getMinutes();

    const todaySessions = sessions
      .filter((s) => s.day_date === todayStr)
      .sort((a, b) => timeToMin(a.start_time) - timeToMin(b.start_time));

    let found: Session | null = null;
    let next: Session | null = null;

    for (const s of todaySessions) {
      const start = timeToMin(s.start_time);
      const end = timeToMin(s.end_time);
      if (nowTime >= start && nowTime < end) {
        found = s;
      } else if (nowTime < start && !next) {
        next = s;
      }
    }
    setCurrentSession(found);
    setNextSession(next);
  }, [now, sessions]);

  const loadSessions = async () => {
    const { data } = await supabase
      .from("schedule_sessions")
      .select("*")
      .eq("conference_id", conferenceId)
      .order("day_date")
      .order("start_time") as any;
    setSessions(data || []);
  };

  const timeToMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-accent" />
        <h3 className="font-display font-semibold text-foreground text-sm">Live Conference Clock</h3>
      </div>
      <p className="font-mono text-2xl font-bold text-foreground text-center mb-3">{formatTime(now)}</p>
      {currentSession ? (
        <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-accent font-medium">NOW</p>
          <p className="font-display font-semibold text-foreground">{currentSession.name}</p>
          <p className="text-xs text-muted-foreground">{currentSession.start_time} — {currentSession.end_time}</p>
        </div>
      ) : nextSession ? (
        <div className="bg-secondary/50 rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground font-medium">UP NEXT</p>
          <p className="font-display font-semibold text-foreground">{nextSession.name}</p>
          <p className="text-xs text-muted-foreground">{nextSession.start_time} — {nextSession.end_time}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center">No active sessions right now.</p>
      )}
    </div>
  );
};

export default LiveConferenceClock;
