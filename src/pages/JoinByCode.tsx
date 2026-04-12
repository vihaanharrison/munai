import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const JoinByCode = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Looking up code...");

  useEffect(() => {
    if (!code) return;
    resolveCode(code.toUpperCase());
  }, [code]);

  const resolveCode = async (c: string) => {
    try {
      // Check standalone committee code (6 chars) — delegate access
      if (c.length === 6) {
        const { data: sc } = await supabase
          .from("standalone_committees" as any)
          .select("id")
          .eq("committee_code", c)
          .maybeSingle() as any;
        if (sc) {
          navigate(`/standalone-delegate/${sc.id}`, { replace: true });
          return;
        }
      }

      // Check standalone chair code (8 chars) — chair access
      if (c.length === 8) {
        const { data: sc } = await supabase
          .from("standalone_committees" as any)
          .select("id")
          .eq("chair_code", c)
          .maybeSingle() as any;
        if (sc) {
          navigate(`/standalone/${sc.id}`, { replace: true });
          return;
        }
      }

      // Check if it's a public conference code (6 chars)
      const { data: pubConf } = await supabase
        .from("conferences")
        .select("id")
        .eq("public_code", c)
        .maybeSingle() as any;

      if (pubConf) {
        navigate(`/conference/${pubConf.id}`, { replace: true });
        return;
      }

      // Check if it's a secgen code
      const { data: sgConf } = await supabase
        .from("conferences")
        .select("id")
        .eq("secgen_code", c)
        .maybeSingle() as any;

      if (sgConf) {
        navigate(`/auth?redirect=secgen/${sgConf.id}`, { replace: true });
        return;
      }

      // Check if it's a secretariat code
      const { data: secConf } = await supabase
        .from("conferences")
        .select("id")
        .eq("secretariat_code", c)
        .maybeSingle() as any;

      if (secConf) {
        navigate(`/auth?redirect=secretariat/${secConf.id}`, { replace: true });
        return;
      }

      // Check if it's a chair code
      const { data: committee } = await supabase
        .from("committees")
        .select("id, conference_id")
        .eq("chair_code", c)
        .maybeSingle() as any;

      if (committee) {
        navigate(`/chair/${committee.conference_id}/${committee.id}`, { replace: true });
        return;
      }

      setStatus("Invalid code");
      toast.error("Code not recognized. Please check and try again.");
      setTimeout(() => navigate("/"), 2000);
    } catch {
      toast.error("Error looking up code");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#efeeea] flex items-center justify-center p-4">
      <div className="text-center animate-fade-in">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
};

export default JoinByCode;
