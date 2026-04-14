import { useState } from "react";
import { useNavigate } from "react-router-dom";
import munLogo from "@/assets/mun-ai-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, ArrowRight, Users, Gavel, BookOpen, Sparkles, Info } from "lucide-react";

const Index = () => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleEnterCode = () => {
    if (!code.trim()) return;
    navigate(`/join/${code.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col pr-20">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 pb-8 pt-6">
        <div className="w-full max-w-2xl animate-fade-in text-center">
          {/* Large Logo */}
          <img
            src={munLogo}
            alt="MUN AI Logo"
            className="h-40 md:h-52 lg:h-60 object-contain mx-auto mb-6 animate-float"
          />

          <p className="text-muted-foreground text-base md:text-lg mb-10 max-w-md mx-auto leading-relaxed">
            The AI-powered platform for managing Model United Nations conferences — from creation to resolution.
          </p>

          {/* Primary CTA: Join Conference */}
          <div className="glass-card-elevated rounded-2xl p-8 max-w-md mx-auto mb-10 hover-lift">
            <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <Globe className="w-8 h-8 text-accent-foreground" />
            </div>
            <h1 className="font-display font-bold text-foreground text-2xl mb-2">
              Join Conference
            </h1>
            <p className="text-sm text-muted-foreground mb-5">
              Enter your conference, committee, or role code
            </p>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="font-mono tracking-widest text-center uppercase rounded-xl text-lg h-12 bg-background/60 backdrop-blur-sm"
                maxLength={12}
                onKeyDown={(e) => e.key === "Enter" && handleEnterCode()}
              />
              <Button
                onClick={handleEnterCode}
                disabled={!code.trim()}
                className="rounded-xl px-6 h-12 gradient-primary border-0 hover-glow"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { icon: Users, title: "Delegate Management", desc: "Register, track, and manage delegations" },
              { icon: Gavel, title: "Chair Tools", desc: "GSL, motions, voting, and session control" },
              { icon: BookOpen, title: "Live Schedule", desc: "Real-time clock with session tracking" },
              { icon: Sparkles, title: "AI Assistant", desc: "Speech analysis, scoring, and drafting" },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="glass-card rounded-2xl p-4 text-center hover-lift"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <Icon className="w-7 h-7 text-accent mx-auto mb-2" />
                <h4 className="font-display font-semibold text-foreground text-xs mb-1">{title}</h4>
                <p className="text-[11px] text-muted-foreground leading-tight">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-5 space-y-2">
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => navigate("/about")} className="text-xs text-muted-foreground hover:text-accent transition-smooth flex items-center gap-1">
            <Info className="w-3 h-3" /> About
          </button>
          <button onClick={() => navigate("/hmun-rop")} className="text-xs text-muted-foreground hover:text-accent transition-smooth flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> HMUN ROP
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Powered by AI · Built for diplomacy</p>
      </footer>
    </div>
  );
};

export default Index;
