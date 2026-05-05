import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Calendar, Mail, ExternalLink, Loader2, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import munLogo from "@/assets/mun-ai-logo.png";
import LiveConferenceClock from "@/components/LiveConferenceClock";

const ConferencePublic = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conference, setConference] = useState<any>(null);
  const [committees, setCommittees] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("conferences_public").select("*").eq("id", id).single(),
      supabase.from("committees").select("*").eq("conference_id", id),
      supabase.from("schedule_sessions").select("*").eq("conference_id", id).order("day_date").order("start_time") as any,
      supabase.from("conference_updates").select("*").eq("conference_id", id).is("committee_id", null).order("created_at", { ascending: false }).limit(5) as any,
    ]).then(([confRes, comRes, schedRes, updRes]) => {
      setConference(confRes.data);
      setCommittees((comRes.data as any) || []);
      setSchedule(schedRes.data || []);
      setUpdates(updRes.data || []);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="min-h-screen gradient-hero flex items-center justify-center pr-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  if (!conference) {
    return <div className="min-h-screen gradient-hero flex items-center justify-center pr-20"><p className="text-muted-foreground">Conference not found</p></div>;
  }

  return (
    <div className="min-h-screen gradient-hero p-4 pr-20">
      <div className="max-w-2xl mx-auto pt-8 animate-fade-in space-y-4">
        {conference.banner_url && (
          <img src={conference.banner_url} alt="Banner" className="w-full h-48 object-cover rounded-2xl" />
        )}

        <div className="flex items-center gap-4">
          <img src={conference.logo_url || munLogo} alt={conference.name} className="w-16 h-16 rounded-xl object-contain" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{conference.name}</h1>
          </div>
        </div>

        {conference.ended_at && (() => {
          const endsAt = new Date(new Date(conference.ended_at).getTime() + 48 * 3600000);
          const hoursLeft = Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 3600000));
          return (
            <div className="glass-card rounded-2xl p-4 border border-accent/30">
              <p className="text-xs uppercase tracking-wide text-accent font-semibold">Conference ended</p>
              <p className="text-sm text-foreground mt-1">Archive download window closes in <strong>{hoursLeft}h</strong> ({endsAt.toLocaleString()}). Data is permanently purged afterwards.</p>
            </div>
          );
        })()}

        {/* Live Clock */}
        {id && <LiveConferenceClock conferenceId={id} />}

        <div className="glass-card rounded-2xl p-6 space-y-4">
          {conference.start_date && (
            <div className="flex items-center gap-3 text-foreground">
              <Calendar className="w-5 h-5 text-accent" />
              <span>{conference.start_date} — {conference.end_date}</span>
            </div>
          )}
          {conference.location && (
            <div className="flex items-center gap-3 text-foreground">
              <MapPin className="w-5 h-5 text-accent" />
              <span>{conference.location}</span>
            </div>
          )}
          {conference.email && (
            <div className="flex items-center gap-3 text-foreground">
              <Mail className="w-5 h-5 text-accent" />
              <a href={`mailto:${conference.email}`} className="hover:text-accent transition-colors">{conference.email}</a>
            </div>
          )}
          {conference.payment_link && (
            <div className="flex items-center gap-3 text-foreground">
              <ExternalLink className="w-5 h-5 text-accent" />
              <a href={conference.payment_link} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                Payment — {conference.payment_amount || "See details"}
              </a>
            </div>
          )}
        </div>

        {/* Committees */}
        {committees.length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-accent" /> Committees
            </h2>
            {committees.map((c: any) => (
              <div key={c.id} className="bg-secondary/50 rounded-xl px-4 py-2.5 mb-2">
                <p className="font-medium text-foreground text-sm">{c.name}</p>
                {c.topic && <p className="text-xs text-muted-foreground">{c.topic}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Schedule */}
        {schedule.length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-accent" /> Schedule
            </h2>
            {schedule.map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-2 mb-1">
                <span className="text-sm font-medium text-foreground flex-1">{s.name}</span>
                <span className="text-xs text-muted-foreground font-mono">{s.start_time} — {s.end_time}</span>
              </div>
            ))}
          </div>
        )}

        {/* Updates */}
        {updates.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-display font-semibold text-foreground text-sm px-1">Announcements</h2>
            {updates.map((u: any) => (
              <div key={u.id} className="glass-card rounded-2xl p-4">
                <p className="text-xs text-accent font-medium mb-1">Update from: {u.author_name}</p>
                {u.title && <h3 className="font-display font-semibold text-foreground text-sm">{u.title}</h3>}
                <p className="text-sm text-foreground mt-1">{u.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* Register as Delegate CTA */}
        <Button
          onClick={() => navigate(`/delegate/${id}`)}
          className="w-full rounded-xl h-12 gradient-accent border-0 font-semibold text-base"
        >
          Register as Delegate
        </Button>
      </div>
    </div>
  );
};

export default ConferencePublic;
