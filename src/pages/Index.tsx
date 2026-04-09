import { useState } from "react";
import { useNavigate } from "react-router-dom";
import munLogo from "@/assets/mun-ai-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Plus, ArrowRight, Users, Gavel, BookOpen, Sparkles } from "lucide-react";

const Index = () => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleEnterCode = () => {
    if (!code.trim()) return;
    navigate(`/join/${code.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-[#efeeea] flex flex-col">
      {/* Header */}
      <header className="w-full flex items-center justify-center py-8 px-4">
        <img
          src={munLogo}
          alt="MUN AI Logo"
          className="h-24 md:h-32 object-contain"
        />
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center px-4 pb-12">
        <div className="w-full max-w-4xl animate-fade-in">
          <p className="text-center text-muted-foreground text-base md:text-lg mb-10 max-w-xl mx-auto">
            The AI-powered platform for managing Model United Nations conferences — from creation to resolution.
          </p>

          {/* Primary Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto mb-12">
            <button
              onClick={() => navigate("/create-conference")}
              className="glass-card rounded-2xl p-6 flex flex-col items-center gap-3 hover:shadow-elevated transition-all duration-200 group cursor-pointer text-center"
            >
              <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
                <Plus className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground text-lg">Create Conference</h2>
                <p className="text-sm text-muted-foreground mt-1">Set up and manage a new MUN conference</p>
              </div>
            </button>

            <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-xl gradient-accent flex items-center justify-center">
                <Globe className="w-7 h-7 text-accent-foreground" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground text-lg">Enter Code</h2>
                <p className="text-sm text-muted-foreground mt-1">Join with a conference or role code</p>
              </div>
              <div className="flex gap-2 w-full mt-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="font-mono tracking-widest text-center uppercase rounded-xl"
                  maxLength={12}
                  onKeyDown={(e) => e.key === "Enter" && handleEnterCode()}
                />
                <Button
                  onClick={handleEnterCode}
                  disabled={!code.trim()}
                  className="rounded-xl px-6 gradient-primary border-0"
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="max-w-3xl mx-auto">
            <h3 className="font-display font-bold text-foreground text-xl text-center mb-6">
              Everything you need for MUN
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Users, title: "Delegate Management", desc: "Register, track attendance, and manage delegations" },
                { icon: Gavel, title: "Chair Tools", desc: "GSL, motions, voting, and real-time session control" },
                { icon: BookOpen, title: "Live Schedule", desc: "Real-time conference clock with session tracking" },
                { icon: Sparkles, title: "AI Assistant", desc: "Speech analysis, resolution drafting, and scoring" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass-card rounded-2xl p-5 text-center">
                  <Icon className="w-8 h-8 text-accent mx-auto mb-3" />
                  <h4 className="font-display font-semibold text-foreground text-sm mb-1">{title}</h4>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-muted-foreground">
        Powered by AI · Built for diplomacy
      </footer>
    </div>
  );
};

export default Index;
