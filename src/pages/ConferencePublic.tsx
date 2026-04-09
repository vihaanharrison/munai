import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Calendar, Mail, ExternalLink, Loader2 } from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";

const ConferencePublic = () => {
  const { id } = useParams<{ id: string }>();
  const [conference, setConference] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("conferences")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setConference(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!conference) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <p className="text-muted-foreground">Conference not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero p-4">
      <div className="max-w-2xl mx-auto pt-8 animate-fade-in">
        {conference.banner_url && (
          <img
            src={conference.banner_url}
            alt="Banner"
            className="w-full h-48 object-cover rounded-2xl mb-6"
          />
        )}

        <div className="flex items-center gap-4 mb-6">
          <img
            src={conference.logo_url || munLogo}
            alt={conference.name}
            className="w-16 h-16 rounded-xl object-contain"
          />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {conference.name}
            </h1>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-4">
          {conference.start_date && (
            <div className="flex items-center gap-3 text-foreground">
              <Calendar className="w-5 h-5 text-accent" />
              <span>
                {conference.start_date} — {conference.end_date}
              </span>
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
              <a href={`mailto:${conference.email}`} className="hover:text-accent transition-colors">
                {conference.email}
              </a>
            </div>
          )}

          {conference.payment_link && (
            <div className="flex items-center gap-3 text-foreground">
              <ExternalLink className="w-5 h-5 text-accent" />
              <a
                href={conference.payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                Payment — {conference.payment_amount || "See details"}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConferencePublic;
