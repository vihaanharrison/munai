import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Globe, UserCircle, LayoutDashboard, Compass, Info, BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const GlobalNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthed(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => subscription.unsubscribe();
  }, []);

  const tabs = [
    { key: "join", label: "Join", icon: Globe, path: "/" },
    { key: "account", label: "Account", icon: UserCircle, path: authed ? "/profile" : "/auth" },
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { key: "events", label: "Discover", icon: Compass, path: "/events" },
    { key: "chairs", label: "Chairs", icon: Users, path: "/find-chairs" },
    { key: "about", label: "About", icon: Info, path: "/about" },
    { key: "rop", label: "ROP", icon: BookOpen, path: "/hmun-rop" },
  ];

  const accountActive = ["/profile", "/auth"].includes(location.pathname);
  const currentTab = accountActive ? "account" : tabs.find((t) => t.path === location.pathname)?.key || "join";

  const hiddenPaths = ["/secgen/", "/secretariat/", "/chair/", "/standalone/", "/standalone-delegate/", "/delegate/"];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav className="fixed right-0 top-0 h-full z-50 flex items-center pr-3 pointer-events-none">
      <div className="glass-nav rounded-2xl py-4 px-2 flex flex-col gap-2 pointer-events-auto">
        {tabs.map(({ key, label, icon: Icon, path }) => {
          const active = currentTab === key;
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              className={cn(
                "group relative flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all duration-300 ease-out",
                active
                  ? "bg-primary/15 text-primary shadow-glow animate-tab-active"
                  : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 hover:scale-105"
              )}
              title={label}
            >
              <Icon className={cn("w-5 h-5 transition-all duration-300", active ? "text-primary" : "group-hover:scale-110")} />
              <span className={cn("text-[10px] font-medium tracking-wide transition-all duration-300", active ? "text-primary opacity-100" : "opacity-40 group-hover:opacity-80")}>{label}</span>
              {active && <span className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-primary transition-all" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default GlobalNav;
