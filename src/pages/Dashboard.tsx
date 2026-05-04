import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Gavel, LogOut, Loader2, Calendar, ArrowRight, UserCircle } from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";
import ConfirmDialog from "@/components/ConfirmDialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [conferences, setConferences] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      loadData(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadData = async (userId: string) => {
    const [confRes, rolesRes, regRes] = await Promise.all([
      supabase.from("conferences").select("*").eq("secgen_user_id", userId).order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*, conferences_public(name)").eq("user_id", userId),
      supabase.from("event_registrations").select("*, conferences_public(name, start_date, end_date, logo_url)").eq("user_id", userId),
    ]);
    setConferences((confRes.data as any) || []);
    setRoles((rolesRes.data as any) || []);
    setRegistrations((regRes.data as any) || []);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return <div className="min-h-screen gradient-hero flex items-center justify-center pr-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen gradient-hero p-4 pr-20">
      <div className="max-w-3xl mx-auto pt-8 animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={munLogo} alt="MUN AI" className="h-12 object-contain" />
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl" title="Edit Profile" onClick={() => navigate("/profile")}>
              <UserCircle className="w-5 h-5" />
            </Button>
            <ConfirmDialog
              trigger={<Button variant="ghost" size="icon" className="rounded-xl" title="Exit"><LogOut className="w-5 h-5" /></Button>}
              title="Exit"
              description="You'll be signed out of this device. Your conferences and committees stay safe and will be here when you return."
              onConfirm={handleSignOut}
              confirmLabel="Exit"
              variant="destructive"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className="glass-card-elevated rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover-lift"
            onClick={() => navigate("/create-conference")}
          >
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
              <Plus className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Create Conference</h3>
              <p className="text-xs text-muted-foreground">Set up a full MUN conference</p>
            </div>
          </div>
          <div
            className="glass-card-elevated rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover-lift"
            onClick={() => navigate("/create-standalone")}
          >
            <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
              <Gavel className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Chair Portal</h3>
              <p className="text-xs text-muted-foreground">Create a standalone committee</p>
            </div>
          </div>
        </div>

        {/* My Conferences (as SecGen) */}
        {conferences.length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-semibold text-foreground mb-3">My Conferences</h2>
            <div className="space-y-2">
              {conferences.map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3 cursor-pointer hover-lift"
                  onClick={() => navigate(`/secgen/${c.id}`)}
                >
                  <div>
                    <p className="font-medium text-foreground text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.start_date} — {c.end_date}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Roles */}
        {roles.length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-semibold text-foreground mb-3">My Roles</h2>
            <div className="space-y-2">
              {roles.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground text-sm capitalize">{r.role}{r.role_title ? ` — ${r.role_title}` : ""}</p>
                    <p className="text-xs text-muted-foreground">{(r as any).conferences_public?.name || "Conference"}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.approved ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                    {r.approved ? "Active" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Registrations */}
        {registrations.length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" /> Event Registrations
            </h2>
            <div className="space-y-2">
              {registrations.map((r: any) => (
                <div key={r.id} className="bg-muted/30 rounded-xl px-4 py-3">
                  <p className="font-medium text-foreground text-sm">{(r as any).conferences_public?.name || "Event"}</p>
                  <p className="text-xs text-muted-foreground">Registered as {r.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {conferences.length === 0 && roles.length === 0 && registrations.length === 0 && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">No conferences or events yet. Create one or join with a code!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
