import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Sparkles, Trophy, Globe, Award } from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";

type AwardItem = { award: string; committee?: string | null; conference?: string | null; year?: string | null };

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    mun_experience: "",
    conferences_attended: "",
    awards_raw: "",
    avatar_url: "",
    visible_in_discover: false,
    preferred_role: "delegate",
    socials: { linkedin: "", twitter: "", instagram: "", website: "" },
  });
  const [awards, setAwards] = useState<AwardItem[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth?redirect=profile"); return; }
      setUser(session.user);
      const { data } = await (supabase.from("profiles" as any).select("*").eq("user_id", session.user.id).maybeSingle() as any);
      if (data) {
        setForm({
          display_name: data.display_name || "",
          bio: data.bio || "",
          mun_experience: data.mun_experience || "",
          conferences_attended: data.conferences_attended || "",
          awards_raw: data.awards_raw || "",
          avatar_url: data.avatar_url || "",
          visible_in_discover: !!data.visible_in_discover,
          preferred_role: data.preferred_role || "delegate",
          socials: { linkedin: "", twitter: "", instagram: "", website: "", ...(data.socials || {}) },
        });
        setAwards(Array.isArray(data.awards) ? data.awards : []);
      }
      setLoading(false);
    })();
  }, []);

  const parseAwards = async () => {
    if (!form.awards_raw.trim()) { toast.error("Enter your awards first"); return; }
    setParsing(true);
    const { data, error } = await supabase.functions.invoke("parse-awards", { body: { text: form.awards_raw } });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Failed to parse");
    } else {
      setAwards((data as any).awards || []);
      toast.success(`Parsed ${(data as any).awards?.length || 0} award(s)`);
    }
    setParsing(false);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      display_name: form.display_name.trim() || null,
      bio: form.bio.trim() || null,
      mun_experience: form.mun_experience.trim() || null,
      conferences_attended: form.conferences_attended.trim() || null,
      awards_raw: form.awards_raw,
      awards,
      avatar_url: form.avatar_url.trim() || null,
      visible_in_discover: form.visible_in_discover,
      preferred_role: form.preferred_role,
      socials: form.socials,
    };
    const { error } = await (supabase.from("profiles" as any).upsert(payload, { onConflict: "user_id" }) as any);
    if (error) toast.error(error.message); else toast.success("Profile saved");
    setSaving(false);
  };

  const chairEligible = awards.length >= 2;

  if (loading) {
    return <div className="min-h-screen gradient-hero flex items-center justify-center pr-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen gradient-hero p-4 pr-20">
      <div className="max-w-2xl mx-auto pt-8 animate-fade-in space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <img src={munLogo} alt="MUN AI" className="h-12 object-contain" />
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Your Profile</h1>
            <p className="text-xs text-muted-foreground">Manage your MUN identity and Discover visibility</p>
          </div>
        </div>

        <div className={`glass-card rounded-2xl p-4 flex items-center gap-3 ${chairEligible ? "border-accent/40" : ""}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${chairEligible ? "bg-accent/15 text-accent" : "bg-muted/40 text-muted-foreground"}`}>
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{chairEligible ? "Chair-eligible" : "Delegate access only"}</p>
            <p className="text-xs text-muted-foreground">{chairEligible ? "You have 2+ awards parsed — you can register as a chair." : "Add at least 2 awards to unlock chair registration."}</p>
          </div>
        </div>

        <div className="glass-card-elevated rounded-2xl p-6 space-y-4">
          <div>
            <Label className="text-xs">Display name</Label>
            <Input value={form.display_name} onChange={(e) => setForm(p => ({ ...p, display_name: e.target.value }))} className="rounded-xl mt-1.5 bg-background/50" maxLength={80} />
          </div>
          <div>
            <Label className="text-xs">Bio</Label>
            <Textarea value={form.bio} onChange={(e) => setForm(p => ({ ...p, bio: e.target.value }))} className="rounded-xl mt-1.5 bg-background/50 min-h-[70px]" maxLength={500} placeholder="Brief bio..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">MUN experience</Label>
              <Input value={form.mun_experience} onChange={(e) => setForm(p => ({ ...p, mun_experience: e.target.value }))} className="rounded-xl mt-1.5 bg-background/50" placeholder="3 years" maxLength={80} />
            </div>
            <div>
              <Label className="text-xs">Avatar URL</Label>
              <Input value={form.avatar_url} onChange={(e) => setForm(p => ({ ...p, avatar_url: e.target.value }))} className="rounded-xl mt-1.5 bg-background/50" placeholder="https://..." maxLength={500} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Conferences attended</Label>
            <Textarea value={form.conferences_attended} onChange={(e) => setForm(p => ({ ...p, conferences_attended: e.target.value }))} className="rounded-xl mt-1.5 bg-background/50 min-h-[60px]" maxLength={1000} placeholder="HMUN 2024, WIMUN 2023..." />
          </div>
        </div>

        <div className="glass-card-elevated rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold flex items-center gap-2"><Award className="w-4 h-4 text-accent" /> Awards</Label>
            <Button size="sm" variant="ghost" onClick={parseAwards} disabled={parsing} className="rounded-xl text-xs">
              {parsing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
              Parse with AI
            </Button>
          </div>
          <Textarea
            value={form.awards_raw}
            onChange={(e) => setForm(p => ({ ...p, awards_raw: e.target.value }))}
            className="rounded-xl bg-background/50 min-h-[90px]"
            placeholder="Best Delegate at HMUN 2024 in DISEC, Honorable Mention at WIMUN 2023..."
            maxLength={5000}
          />
          {(
            <div className="space-y-2">
              {awards.map((a, i) => (
                <div key={i} className="bg-secondary/40 rounded-xl px-3 py-2 text-sm space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Input value={a.award} onChange={(e) => setAwards(prev => prev.map((x, idx) => idx === i ? { ...x, award: e.target.value } : x))} className="rounded-lg bg-background/60 h-8 text-sm flex-1" placeholder="Award" />
                    <Button type="button" size="sm" variant="ghost" onClick={() => setAwards(prev => prev.filter((_, idx) => idx !== i))} className="rounded-lg h-8 px-2 text-destructive hover:text-destructive">Delete</Button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <Input value={a.committee || ""} onChange={(e) => setAwards(prev => prev.map((x, idx) => idx === i ? { ...x, committee: e.target.value } : x))} className="rounded-lg bg-background/60 h-8 text-xs" placeholder="Committee" />
                    <Input value={a.conference || ""} onChange={(e) => setAwards(prev => prev.map((x, idx) => idx === i ? { ...x, conference: e.target.value } : x))} className="rounded-lg bg-background/60 h-8 text-xs" placeholder="Conference" />
                    <Input value={a.year || ""} onChange={(e) => setAwards(prev => prev.map((x, idx) => idx === i ? { ...x, year: e.target.value } : x))} className="rounded-lg bg-background/60 h-8 text-xs" placeholder="Year" />
                  </div>
                </div>
              ))}
              <Button type="button" size="sm" variant="ghost" onClick={() => setAwards(prev => [...prev, { award: "", committee: "", conference: "", year: "" }])} className="rounded-lg text-xs w-full">+ Add award manually</Button>
            </div>
          )}
        </div>

        <div className="glass-card-elevated rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-accent" /> Show on Discover</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Let conference organisers find you</p>
            </div>
            <Switch checked={form.visible_in_discover} onCheckedChange={(v) => setForm(p => ({ ...p, visible_in_discover: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["linkedin", "twitter", "instagram", "website"] as const).map((k) => (
              <div key={k}>
                <Label className="text-xs capitalize">{k}</Label>
                <Input value={(form.socials as any)[k] || ""} onChange={(e) => setForm(p => ({ ...p, socials: { ...p.socials, [k]: e.target.value } }))} className="rounded-xl mt-1.5 bg-background/50" placeholder={`https://${k}.com/you`} maxLength={300} />
              </div>
            ))}
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full rounded-xl h-11 gradient-primary border-0 font-semibold">
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
};

export default Profile;
