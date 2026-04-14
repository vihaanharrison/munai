import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import munLogo from "@/assets/mun-ai-logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "";
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && redirect) navigate(`/${redirect}`);
      else if (session) navigate("/dashboard");
    });
  }, []);

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (signUpData.session) {
          toast.success("Account created & signed in!");
          navigate(redirect ? `/${redirect}` : "/dashboard");
        } else {
          toast.success("Account created! Check your email to confirm.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in!");
        navigate(redirect ? `/${redirect}` : "/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 pr-20">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <img src={munLogo} alt="MUN AI" className="h-24 md:h-28 object-contain mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp ? "Join the MUN AI platform" : "Sign in to your account"}
          </p>
        </div>

        <div className="glass-card-elevated rounded-2xl p-7 space-y-5">
          {/* Toggle */}
          <div className="flex bg-muted/40 rounded-xl p-1">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-smooth ${
                !isSignUp ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-smooth ${
                isSignUp ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          <div>
            <Label className="text-sm font-medium">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-xl mt-1.5 bg-background/50 backdrop-blur-sm"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl mt-1.5 bg-background/50 backdrop-blur-sm"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-xl h-11 font-semibold gradient-primary border-0 hover-glow"
          >
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
