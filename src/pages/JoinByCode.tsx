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
      const { data, error } = await supabase.rpc("lookup_code", { input_code: c });

      if (error) {
        toast.error("Error looking up code");
        navigate("/");
        return;
      }

      const result = data as { type: string; id?: string; conference_id?: string };

      switch (result.type) {
        case "standalone_delegate":
          navigate(`/standalone-delegate/${result.id}`, { replace: true });
          return;
        case "standalone_chair":
          navigate(`/standalone/${result.id}`, { replace: true });
          return;
        case "conference_public":
          navigate(`/conference/${result.id}`, { replace: true });
          return;
        case "secgen":
          navigate(`/auth?redirect=secgen/${result.id}`, { replace: true });
          return;
        case "secretariat":
          navigate(`/auth?redirect=secretariat/${result.id}`, { replace: true });
          return;
        case "chair":
          navigate(`/chair/${result.conference_id}/${result.id}`, { replace: true });
          return;
        default:
          setStatus("Invalid code");
          toast.error("Code not recognized. Please check and try again.");
          setTimeout(() => navigate("/"), 2000);
      }
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
