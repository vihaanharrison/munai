import { useState } from "react";
import { useNavigate } from "react-router-dom";
import munLogo from "@/assets/mun-ai-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Plus, ArrowRight } from "lucide-react";

const Index = () => {
  const [code, setCode] = useState("");
  const [isEnteringCode, setIsEnteringCode] = useState(false);
  const navigate = useNavigate();

  const handleEnterCode = () => {
    if (!code.trim()) return;
    navigate(`/join/${code.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center animate-fade-in">
        {/* Logo */}
        <img
          src={munLogo}
          alt="MUN AI Logo"
          className="w-28 h-28 mb-2 object-contain"
        />
        <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">
          MUN <span className="text-accent">AI</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1 mb-10 text-center">
          AI-powered Model United Nations platform
        </p>

        {/* Action Cards */}
        <div className="w-full space-y-4">
          <button
            onClick={() => navigate("/create-conference")}
            className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 hover:shadow-elevated transition-all duration-200 group cursor-pointer text-left"
          >
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <Plus className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-semibold text-foreground">Create Conference</h2>
              <p className="text-sm text-muted-foreground">Set up a new MUN conference</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
          </button>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground">Enter Code</h2>
                <p className="text-sm text-muted-foreground">Join with conference or role code</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter your code"
                className="font-mono tracking-widest text-center uppercase rounded-xl"
                maxLength={12}
                onKeyDown={(e) => e.key === "Enter" && handleEnterCode()}
              />
              <Button
                onClick={handleEnterCode}
                disabled={!code.trim()}
                className="rounded-xl px-6 gradient-primary border-0"
              >
                Go
              </Button>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-8 text-center">
          Powered by AI · Built for diplomacy
        </p>
      </div>
    </div>
  );
};

export default Index;
