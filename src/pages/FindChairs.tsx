import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trophy, UserCircle, ExternalLink, Users } from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";

const FindChairs = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [chairs, setChairs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthed(!!session);
      if (!session) { setLoading(false); return; }
      const { data } = await (supabase
        .from("profiles" as any)
        .select("id, display_name, bio, avatar_url, mun_experience, awards, socials")
        .eq("visible_in_discover", true) as any);

      // Score = total chair-related awards; fallback to award count
      const scored = ((data as any) || []).map((p: any) => {
        const arr = Array.isArray(p.awards) ? p.awards : [];
        const chairAwards = arr.filter((a: any) => /chair|director|president|moderator|rapporteur|secretariat|usg|sg/i.test(a?.award || "")).length;
        return { ...p, _chairScore: chairAwards, _totalAwards: arr.length };
      })
      // Show only those with at least 2 awards (chair-eligible)
      .filter((p: any) => p._totalAwards >= 2)
      .sort((a: any, b: any) => (b._chairScore - a._chairScore) || (b._totalAwards - a._totalAwards));

      setChairs(scored);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="min-h-screen gradient-hero flex items-center justify-center pr-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="min-h-screen gradient-hero p-4 pr-20">
      <div className="max-w-3xl mx-auto pt-8 animate-fade-in space-y-5">
        <div className="flex items-center gap-3">
          <img src={munLogo} alt="MUN AI" className="h-12 object-contain" />
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Find Chairs</h1>
            <p className="text-xs text-muted-foreground">Experienced delegates available to chair, ranked by chair-related awards</p>
          </div>
        </div>

        {!authed && (
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Sign in to browse the chair community.</p>
            <button onClick={() => navigate("/auth?redirect=find-chairs")} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm">Sign in</button>
          </div>
        )}

        {authed && chairs.length === 0 && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No chair-eligible profiles yet.</p>
          </div>
        )}

        {chairs.map((p: any, i: number) => (
          <div key={p.id} className="glass-card-elevated rounded-2xl p-5 hover-lift">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary font-bold">#{i + 1}</div>
              {p.avatar_url ? (
                <img src={p.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-secondary/40 flex items-center justify-center"><UserCircle className="w-6 h-6 text-muted-foreground" /></div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-display font-semibold text-foreground">{p.display_name || "Anonymous"}</p>
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full flex items-center gap-1"><Trophy className="w-3 h-3" />{p._chairScore} chair · {p._totalAwards} total</span>
                </div>
                {p.mun_experience && <p className="text-xs text-muted-foreground mt-0.5">{p.mun_experience}</p>}
                {p.bio && <p className="text-sm text-foreground/80 mt-1 line-clamp-3">{p.bio}</p>}
                {Array.isArray(p.awards) && p.awards.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.awards.slice(0, 5).map((a: any, idx: number) => (
                      <span key={idx} className="text-[10px] bg-secondary/40 text-foreground px-2 py-0.5 rounded-full">{a.award}{a.committee ? ` · ${a.committee}` : ""}</span>
                    ))}
                  </div>
                )}
                {p.socials && (p.socials.linkedin || p.socials.website) && (
                  <div className="flex gap-3 mt-2 text-xs text-accent">
                    {p.socials.linkedin && <a href={p.socials.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">LinkedIn <ExternalLink className="w-3 h-3" /></a>}
                    {p.socials.website && <a href={p.socials.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">Website <ExternalLink className="w-3 h-3" /></a>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FindChairs;
