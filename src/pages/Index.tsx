import { useState } from "react";
import { useNavigate } from "react-router-dom";
import munLogo from "@/assets/mun-ai-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Plus, ArrowRight, Users, Gavel, BookOpen, Sparkles, LogIn, UserPlus, LayoutDashboard, Info } from "lucide-react";

type HomeTab = "join" | "signin" | "signup" | "manage";

const Index = () => {
  const [code, setCode] = useState("");
  const [tab, setTab] = useState<HomeTab>("join");
  const navigate = useNavigate();

  const handleEnterCode = () => {
    if (!code.trim()) return;
    navigate(`/join/${code.trim().toUpperCase()}`);
  };

  const tabItems: { key: HomeTab; label: string; icon: any }[] = [
    { key: "join", label: "Join", icon: Globe },
    { key: "signin", label: "Sign In", icon: LogIn },
    { key: "signup", label: "Sign Up", icon: UserPlus },
    { key: "manage", label: "Manage", icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen bg-[#efeeea] flex flex-col">
      {/* Header with large logo */}
      <header className="w-full flex items-center justify-center py-6 px-4">
        <img
          src={munLogo}
          alt="MUN AI Logo"
          className="h-36 md:h-44 lg:h-52 object-contain"
        />
      </header>

      {/* Main content */}
      <section className="flex-1 flex flex-col items-center px-4 pb-12">
        <div className="w-full max-w-4xl animate-fade-in">
          <p className="text-center text-muted-foreground text-base md:text-lg mb-8 max-w-xl mx-auto">
            The AI-powered platform for managing Model United Nations conferences — from creation to resolution.
          </p>

          {/* Navigation Tabs */}
          <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 max-w-lg mx-auto mb-8">
            {tabItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2.5 rounded-lg transition-colors ${
                  tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-w-lg mx-auto mb-10">
            {tab === "join" && (
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-xl gradient-accent flex items-center justify-center mx-auto mb-3">
                    <Globe className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <h2 className="font-display font-semibold text-foreground text-lg">Enter Code</h2>
                  <p className="text-sm text-muted-foreground mt-1">Join with a conference, committee, or role code</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="font-mono tracking-widest text-center uppercase rounded-xl text-lg"
                    maxLength={12}
                    onKeyDown={(e) => e.key === "Enter" && handleEnterCode()}
                  />
                  <Button onClick={handleEnterCode} disabled={!code.trim()} className="rounded-xl px-6 gradient-primary border-0">
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {tab === "signin" && (
              <div className="glass-card rounded-2xl p-6 space-y-4 text-center">
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3">
                  <LogIn className="w-7 h-7 text-primary-foreground" />
                </div>
                <h2 className="font-display font-semibold text-foreground text-lg">Sign In</h2>
                <p className="text-sm text-muted-foreground">For Secretary-Generals and Secretariat members</p>
                <Button onClick={() => navigate("/auth")} className="w-full rounded-xl h-11 gradient-primary border-0 font-semibold">
                  Sign In with Email
                </Button>
              </div>
            )}

            {tab === "signup" && (
              <div className="glass-card rounded-2xl p-6 space-y-4 text-center">
                <div className="w-14 h-14 rounded-xl gradient-accent flex items-center justify-center mx-auto mb-3">
                  <UserPlus className="w-7 h-7 text-accent-foreground" />
                </div>
                <h2 className="font-display font-semibold text-foreground text-lg">Sign Up</h2>
                <p className="text-sm text-muted-foreground">Create an account to manage conferences</p>
                <Button onClick={() => navigate("/auth?mode=signup")} className="w-full rounded-xl h-11 gradient-primary border-0 font-semibold">
                  Create Account
                </Button>
              </div>
            )}

            {tab === "manage" && (
              <div className="space-y-3">
                <div className="glass-card rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-elevated transition-all" onClick={() => navigate("/create-conference")}>
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                    <Plus className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">Create Conference</h3>
                    <p className="text-xs text-muted-foreground">Set up a full MUN conference</p>
                  </div>
                </div>
                <div className="glass-card rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-elevated transition-all" onClick={() => navigate("/create-standalone")}>
                  <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
                    <Gavel className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">Chair Portal</h3>
                    <p className="text-xs text-muted-foreground">Create a standalone committee</p>
                  </div>
                </div>
              </div>
            )}
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

      {/* Footer links */}
      <footer className="text-center py-6 space-y-2">
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => navigate("/about")} className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1">
            <Info className="w-3 h-3" /> About
          </button>
          <button onClick={() => navigate("/hmun-rop")} className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> HMUN ROP
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Powered by AI · Built for diplomacy</p>
      </footer>
    </div>
  );
};

export default Index;
