import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CalendarDays, MapPin, Mail, ExternalLink, Users, Trophy, UserCircle } from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";
import { toast } from "sonner";

const UpcomingEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [committees, setCommittees] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [regForm, setRegForm] = useState({ name: "", email: "", responses: {} as Record<string, string> });
  const [submitting, setSubmitting] = useState(false);
  const [existingRegs, setExistingRegs] = useState<Set<string>>(new Set());
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      loadEvents(session?.user?.id);
    });
  }, []);

  const loadEvents = async (userId?: string) => {
    const { data } = await supabase
      .from("conferences_public")
      .select("*")
      .eq("published", true)
      .order("start_date", { ascending: true });

    const evts = (data as any) || [];
    setEvents(evts);

    // Load committees for each event
    const ids = evts.map((e: any) => e.id).filter(Boolean);
    if (ids.length > 0) {
      const { data: comData } = await supabase
        .from("committees")
        .select("id, name, conference_id")
        .in("conference_id", ids);
      const grouped: Record<string, any[]> = {};
      (comData || []).forEach((c: any) => {
        if (!grouped[c.conference_id]) grouped[c.conference_id] = [];
        grouped[c.conference_id].push(c);
      });
      setCommittees(grouped);
    }

    // Check existing registrations
    if (userId) {
      const { data: regs } = await supabase
        .from("event_registrations")
        .select("conference_id")
        .eq("user_id", userId);
      setExistingRegs(new Set((regs || []).map((r: any) => r.conference_id)));
    }

    // Load discoverable profiles (only visible if signed in)
    if (userId) {
      const { data: profs } = await (supabase
        .from("profiles" as any)
        .select("id, display_name, bio, avatar_url, mun_experience, awards, preferred_role, socials")
        .eq("visible_in_discover", true)
        .limit(50) as any);
      setProfiles((profs as any) || []);
    }

    setLoading(false);
  };

  const openRegister = async (eventId: string) => {
    if (!user) { toast.error("Please sign in to register"); navigate("/auth?redirect=events"); return; }
    setSelectedEvent(eventId);
    setRegForm({ name: "", email: user.email || "", responses: {} });
    const { data } = await supabase
      .from("conference_custom_questions")
      .select("*")
      .eq("conference_id", eventId)
      .order("sort_order");
    setQuestions((data as any) || []);
  };

  const submitRegistration = async () => {
    if (!selectedEvent || !user) return;
    if (!regForm.name.trim() || !regForm.email.trim()) {
      toast.error("Name and email are required"); return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("event_registrations").insert({
      conference_id: selectedEvent,
      user_id: user.id,
      name: regForm.name.trim(),
      email: regForm.email.trim(),
      custom_responses: regForm.responses,
    } as any);
    if (error) {
      toast.error(error.message?.includes("duplicate") ? "You've already registered" : error.message);
    } else {
      toast.success("Registered successfully!");
      setExistingRegs((prev) => new Set([...prev, selectedEvent]));
      setSelectedEvent(null);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="min-h-screen gradient-hero flex items-center justify-center pr-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen gradient-hero p-4 pr-20">
      <div className="max-w-3xl mx-auto pt-8 animate-fade-in space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <img src={munLogo} alt="MUN AI" className="h-12 object-contain" />
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Discover</h1>
            <p className="text-xs text-muted-foreground">Browse upcoming conferences and community profiles</p>
          </div>
        </div>

        {events.length === 0 && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No upcoming events published yet.</p>
          </div>
        )}

        {events.map((evt: any) => (
          <div key={evt.id} className="glass-card-elevated rounded-2xl overflow-hidden hover-lift">
            {evt.banner_url && (
              <img src={evt.banner_url} alt="" className="w-full h-36 object-cover" />
            )}
            <div className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <img src={evt.logo_url || munLogo} alt="" className="w-14 h-14 rounded-xl object-contain flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="font-display font-bold text-foreground text-lg">{evt.name}</h2>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    {evt.start_date && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {evt.start_date} — {evt.end_date}
                      </span>
                    )}
                    {evt.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {evt.location}
                      </span>
                    )}
                    {evt.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {evt.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Committees */}
              {committees[evt.id]?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {committees[evt.id].map((c: any) => (
                    <span key={c.id} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                      {c.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Payment info */}
              {evt.payment_amount && (
                <p className="text-xs text-muted-foreground">
                  Fee: <span className="font-medium text-foreground">{evt.payment_amount}</span>
                  {evt.payment_link && (
                    <a href={evt.payment_link} target="_blank" rel="noreferrer" className="text-accent ml-2 inline-flex items-center gap-0.5 hover:underline">
                      Pay <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </p>
              )}

              {/* Register button */}
              <div className="flex items-center gap-2 pt-1">
                {existingRegs.has(evt.id) ? (
                  <span className="text-xs text-primary font-medium bg-primary/10 px-3 py-1.5 rounded-lg">✓ Registered</span>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => openRegister(evt.id)}
                    className="rounded-xl gradient-primary border-0 text-xs hover-glow"
                  >
                    <Users className="w-3.5 h-3.5 mr-1" /> Register
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/conference/${evt.id}`)}
                  className="rounded-xl text-xs"
                >
                  View Details
                </Button>
              </div>
            </div>

            {/* Registration Form Modal */}
            {selectedEvent === evt.id && (
              <div className="border-t border-border/50 p-5 bg-muted/20 animate-fade-in space-y-3">
                <h3 className="font-display font-semibold text-foreground text-sm">Registration</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Full Name *</Label>
                    <Input value={regForm.name} onChange={(e) => setRegForm(p => ({ ...p, name: e.target.value }))} className="rounded-xl mt-1 text-sm bg-background/50" />
                  </div>
                  <div>
                    <Label className="text-xs">Email *</Label>
                    <Input value={regForm.email} onChange={(e) => setRegForm(p => ({ ...p, email: e.target.value }))} className="rounded-xl mt-1 text-sm bg-background/50" />
                  </div>
                </div>
                {questions.map((q: any) => (
                  <div key={q.id}>
                    <Label className="text-xs">{q.question_text}</Label>
                    <Input
                      value={regForm.responses[q.id] || ""}
                      onChange={(e) => setRegForm(p => ({ ...p, responses: { ...p.responses, [q.id]: e.target.value } }))}
                      className="rounded-xl mt-1 text-sm bg-background/50"
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button size="sm" onClick={submitRegistration} disabled={submitting} className="rounded-xl gradient-primary border-0 text-xs">
                    {submitting ? "Submitting..." : "Submit Registration"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedEvent(null)} className="rounded-xl text-xs">Cancel</Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Discoverable Profiles */}
        {profiles.length > 0 && (
          <div className="pt-6">
            <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-accent" /> Community
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profiles.map((p: any) => (
                <div key={p.id} className="glass-card rounded-2xl p-4 hover-lift">
                  <div className="flex items-start gap-3">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <UserCircle className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-foreground text-sm truncate">{p.display_name || "Anonymous"}</p>
                      {p.mun_experience && <p className="text-xs text-muted-foreground">{p.mun_experience}</p>}
                      {p.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.bio}</p>}
                      {Array.isArray(p.awards) && p.awards.length > 0 && (
                        <p className="text-xs text-accent mt-1.5 flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> {p.awards.length} award{p.awards.length === 1 ? "" : "s"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!user && (
          <div className="glass-card rounded-2xl p-4 text-center text-xs text-muted-foreground">
            Sign in to see community members and register for events.
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingEvents;
