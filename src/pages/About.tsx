import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, Users, Gavel, BookOpen, Sparkles, Shield, MessageSquare, BarChart3, Mic, AlertTriangle, FileText, Clock } from "lucide-react";
import munLogo from "@/assets/mun-ai-logo.png";

const features = [
  {
    icon: Globe,
    title: "Conference Creation",
    desc: "Create a full MUN conference with a single form. Set your conference name, dates, location, and payment details. The platform auto-generates unique codes: a Public Code for delegates, a SecGen Code for the Secretary-General, and a Secretariat Code for staff. Share these codes and your conference is live."
  },
  {
    icon: Users,
    title: "Role System",
    desc: "Four distinct roles — Secretary-General, Secretariat, Chair, and Delegate — each with dedicated portals. SecGen creates the conference and manages all committees. Secretariat members coordinate internally. Chairs manage their assigned committee. Delegates participate in debate. Roles are device-locked: only one active session per device at a time."
  },
  {
    icon: Shield,
    title: "Secretariat Tools",
    desc: "Secretariat members access a real-time coordination chat, task checklists, and the ability to push global conference announcements. Only secretariat can enable 'Crisis Mode' for a committee, unlocking crisis tools for that committee's chair."
  },
  {
    icon: Gavel,
    title: "Chair Tools",
    desc: "Chairs log in with an 8-character Chair Code — no email needed. Up to 3 chairs share a committee. Chairs approve delegate registrations, set agendas, manage the speakers list with a live timer, approve/reject POIs, create and manage blocs, push committee-specific updates, upload files, and use the AI-powered scoring spreadsheet."
  },
  {
    icon: Users,
    title: "Delegate Registration",
    desc: "Delegates register from the public page or by entering the conference code. They select from the committee's delegation matrix — taken delegations are greyed out. No email or password required. Registration goes to the chair for real-time approval before the delegate gains platform access."
  },
  {
    icon: Mic,
    title: "Speakers List & Timer",
    desc: "A unified speakers list covers GSL, moderated caucus, and crisis speeches. The chair builds the list, starts the timer, and controls the flow. All delegates see the current speaker, upcoming speakers, and a live countdown timer in real time via Supabase Realtime."
  },
  {
    icon: MessageSquare,
    title: "Point of Information (POI) System",
    desc: "Delegates submit digital POIs to other delegates within the same committee. Each POI goes through chair approval before delivery. Approved POIs award +1 point to the sender automatically. The chair has a searchable POI history panel. Delegates see incoming POIs labelled 'Unmarked' or 'Marked.'"
  },
  {
    icon: Shield,
    title: "Blocs & Directives",
    desc: "Chairs create blocs within their committee. Approved delegates can join blocs. The chair assigns a Bloc Leader who can upload one file or link as a directive. Discussion status tracks progress: 'Yet to Discuss,' 'Being Discussed,' or 'Done.' Bloc names are editable."
  },
  {
    icon: AlertTriangle,
    title: "Crisis System",
    desc: "Two modes: Crisis Committee (dedicated from start) and Regular Crisis (enabled mid-conference by secretariat). The chair uploads crisis triggers (text/PDF), and the AI generates a summary that becomes the crisis overview. Multiple triggers build a narrative timeline. All delegates see the live crisis page."
  },
  {
    icon: BarChart3,
    title: "Marking & Scoring",
    desc: "A real-time scoring spreadsheet with up to 7 custom columns plus auto-calculated Total. Chairs edit marks manually or use natural language AI commands like 'USA +10 Speaking' or 'Deduct 3 from France.' The AI uses fuzzy matching to resolve delegation names. After a GSL speech, the AI reviews the text with chair feedback and generates a 0–20 score."
  },
  {
    icon: Gavel,
    title: "Standalone Chair Portal",
    desc: "Create a standalone committee without a full conference — perfect for practice sessions or single-committee events. Get a 6-character delegate code and an 8-character chair code. The standalone committee includes every feature: speakers list, POIs, blocs, scoring, crisis, agendas, and more."
  },
  {
    icon: FileText,
    title: "Document Management",
    desc: "Each delegate can upload a Position Paper (PDF, deletable/re-uploadable) and a GSL Speech (text, AI integrity-checked — rejected if >10% AI-generated). Both are visible only to the chair. The chair views all documents via the delegate profile panel."
  },
  {
    icon: Clock,
    title: "Live Conference Clock",
    desc: "A real-time clock displays the current active session based on the conference schedule, updating automatically. Visible to all roles across all portals."
  },
];

const About = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#efeeea] p-4">
      <div className="max-w-3xl mx-auto pt-6 pb-12 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
          <img src={munLogo} alt="MUN AI" className="h-12 object-contain" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">About MUNai</h1>
            <p className="text-sm text-muted-foreground">The AI-powered Model United Nations platform</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-6">
          <p className="text-foreground leading-relaxed">
            MUNai is a comprehensive, AI-powered platform for managing Model United Nations conferences from creation to resolution. Whether you're running a full conference with hundreds of delegates or a single standalone committee practice session, MUNai provides every tool you need — speakers lists, POIs, blocs, crisis management, real-time scoring, and AI-assisted features — all in one polished, code-based platform.
          </p>
        </div>

        <div className="space-y-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground text-base mb-1">{title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button onClick={() => navigate("/")} className="rounded-xl gradient-primary border-0 font-semibold px-8">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default About;
